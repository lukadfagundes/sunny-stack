#!/bin/bash
# =============================================================================
# Test Docker Build Locally
# =============================================================================
# This script builds and tests the Discord bot Docker image locally
# Useful for validating changes before pushing to production
#
# Usage:
#   ./scripts/test-docker-local.sh [--arm64] [--clean]
#
# Options:
#   --arm64    Build for ARM64 (Raspberry Pi) architecture
#   --clean    Clean build (no cache)
#
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_step() { echo -e "\n${BLUE}==>${NC} $1"; }

# Parse arguments
PLATFORM="linux/amd64"
CACHE_FLAG=""

for arg in "$@"; do
  case $arg in
    --arm64)
      PLATFORM="linux/arm64"
      shift
      ;;
    --clean)
      CACHE_FLAG="--no-cache"
      shift
      ;;
  esac
done

# Configuration
IMAGE_NAME="sunny-stack-bot"
TAG="local-test"
CONTAINER_NAME="sunny-stack-bot-test"
HEALTH_PORT=8080

echo "============================================================"
echo "Sunny Stack - Local Docker Build Test"
echo "============================================================"
echo ""
log_info "Platform: $PLATFORM"
log_info "Image: $IMAGE_NAME:$TAG"
log_info "Cache: $([ -z "$CACHE_FLAG" ] && echo "enabled" || echo "disabled")"
echo ""

# -----------------------------------------------------------------------------
# 1. Prerequisites Check
# -----------------------------------------------------------------------------
log_step "Step 1/7: Checking prerequisites"

if ! command -v docker &> /dev/null; then
  log_error "Docker not found. Install Docker Desktop or Docker Engine."
fi

if ! docker info &> /dev/null; then
  log_error "Docker daemon not running. Start Docker and try again."
fi

log_info "✅ Docker: $(docker --version)"

# Check for buildx (required for ARM64)
if [ "$PLATFORM" = "linux/arm64" ]; then
  if ! docker buildx version &> /dev/null; then
    log_error "Docker buildx not available. Update Docker to latest version."
  fi
  log_info "✅ Docker buildx: $(docker buildx version)"
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
  log_warn ".env.local not found. Container may fail to start."
  log_info "Create .env.local or use .env.example"
fi

# -----------------------------------------------------------------------------
# 2. Cleanup Old Test Containers/Images
# -----------------------------------------------------------------------------
log_step "Step 2/7: Cleaning up old test containers"

if docker ps -a | grep -q "$CONTAINER_NAME"; then
  log_info "Removing existing test container..."
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
fi

if [ "$CACHE_FLAG" = "--no-cache" ]; then
  log_info "Removing old test images (clean build requested)..."
  docker rmi "$IMAGE_NAME:$TAG" 2>/dev/null || true
fi

# -----------------------------------------------------------------------------
# 3. Build Docker Image
# -----------------------------------------------------------------------------
log_step "Step 3/7: Building Docker image"

log_info "Building for $PLATFORM..."
echo ""

BUILD_START=$(date +%s)

if [ "$PLATFORM" = "linux/arm64" ]; then
  # ARM64 build with buildx
  docker buildx build \
    --platform "$PLATFORM" \
    --tag "$IMAGE_NAME:$TAG" \
    --load \
    $CACHE_FLAG \
    .
else
  # Standard AMD64 build
  docker build \
    --platform "$PLATFORM" \
    --tag "$IMAGE_NAME:$TAG" \
    $CACHE_FLAG \
    .
fi

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

echo ""
log_info "✅ Build completed in ${BUILD_TIME}s"

# -----------------------------------------------------------------------------
# 4. Check Image Size
# -----------------------------------------------------------------------------
log_step "Step 4/7: Checking image size"

IMAGE_SIZE=$(docker images "$IMAGE_NAME:$TAG" --format "{{.Size}}")
log_info "Image size: $IMAGE_SIZE"

# Convert to MB for comparison (rough estimate)
if [[ "$IMAGE_SIZE" == *"GB"* ]]; then
  log_warn "⚠️  Image is over 1GB! Target is <500MB"
elif [[ "$IMAGE_SIZE" == *"MB"* ]]; then
  SIZE_NUM=$(echo "$IMAGE_SIZE" | grep -oE '[0-9]+')
  if [ "$SIZE_NUM" -gt 500 ]; then
    log_warn "⚠️  Image is ${IMAGE_SIZE} (target: <500MB)"
  else
    log_info "✅ Image size within target (<500MB)"
  fi
fi

# Show image details
echo ""
log_info "Image details:"
docker images "$IMAGE_NAME:$TAG"

# -----------------------------------------------------------------------------
# 5. Start Test Container
# -----------------------------------------------------------------------------
log_step "Step 5/7: Starting test container"

log_info "Starting container: $CONTAINER_NAME"

if [ -f ".env.local" ]; then
  docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$HEALTH_PORT:8080" \
    --env-file .env.local \
    "$IMAGE_NAME:$TAG"
else
  log_warn "Starting without .env.local (may fail)"
  docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$HEALTH_PORT:8080" \
    -e NODE_ENV=production \
    -e DEPLOYMENT_MODE=pi \
    "$IMAGE_NAME:$TAG"
fi

log_info "✅ Container started"

# Wait for startup
log_info "Waiting for container to start (15s)..."
sleep 15

# -----------------------------------------------------------------------------
# 6. Health Check
# -----------------------------------------------------------------------------
log_step "Step 6/7: Testing health endpoint"

log_info "Checking http://localhost:$HEALTH_PORT/health"

for i in {1..10}; do
  if curl -sf "http://localhost:$HEALTH_PORT/health" > /tmp/health-response.json; then
    log_info "✅ Health check passed (attempt $i)"
    echo ""
    log_info "Health response:"
    cat /tmp/health-response.json | python3 -m json.tool 2>/dev/null || cat /tmp/health-response.json
    echo ""
    HEALTH_OK=true
    break
  else
    log_warn "Health check failed (attempt $i/10)"
    sleep 3
  fi
done

if [ "$HEALTH_OK" != "true" ]; then
  log_error "❌ Health endpoint not responding after 10 attempts"
fi

# -----------------------------------------------------------------------------
# 7. Verify Logs
# -----------------------------------------------------------------------------
log_step "Step 7/7: Checking container logs"

log_info "Recent logs (last 30 lines):"
echo ""
docker logs "$CONTAINER_NAME" --tail=30

echo ""

if docker logs "$CONTAINER_NAME" 2>&1 | grep -qi "error"; then
  log_warn "⚠️  Errors found in logs (see above)"
else
  log_info "✅ No errors in logs"
fi

# Check for bot ready message
if docker logs "$CONTAINER_NAME" 2>&1 | grep -q "Bot ready\|Ready!\|Logged in as"; then
  log_info "✅ Bot connected to Discord"
else
  log_warn "⚠️  Bot connection not confirmed (may need valid DISCORD_BOT_TOKEN)"
fi

# -----------------------------------------------------------------------------
# Interactive Menu
# -----------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "Test container is running. What would you like to do?"
echo "============================================================"
echo ""
echo "1. View live logs (Ctrl+C to exit)"
echo "2. Test graceful shutdown"
echo "3. Run shell inside container"
echo "4. Keep container running"
echo "5. Stop and remove container"
echo ""
read -p "Choose option (1-5): " -n 1 -r
echo ""

case $REPLY in
  1)
    log_info "Streaming logs (Ctrl+C to stop)..."
    docker logs -f "$CONTAINER_NAME"
    ;;
  2)
    log_info "Testing graceful shutdown..."
    docker stop "$CONTAINER_NAME"
    echo ""
    log_info "Shutdown logs (last 20 lines):"
    docker logs "$CONTAINER_NAME" --tail=20
    echo ""
    log_info "✅ Shutdown complete"
    docker rm "$CONTAINER_NAME"
    ;;
  3)
    log_info "Opening shell in container..."
    docker exec -it "$CONTAINER_NAME" /bin/sh || docker exec -it "$CONTAINER_NAME" /bin/bash
    ;;
  4)
    log_info "Container will keep running in background"
    echo ""
    log_info "Useful commands:"
    echo "  View logs:   docker logs -f $CONTAINER_NAME"
    echo "  Stop:        docker stop $CONTAINER_NAME"
    echo "  Remove:      docker rm -f $CONTAINER_NAME"
    echo "  Health:      curl http://localhost:$HEALTH_PORT/health"
    ;;
  5)
    log_info "Stopping and removing container..."
    docker stop "$CONTAINER_NAME"
    docker rm "$CONTAINER_NAME"
    log_info "✅ Cleanup complete"
    ;;
  *)
    log_info "Invalid option. Container left running."
    ;;
esac

echo ""
echo "============================================================"
echo "✅ Docker Test Complete!"
echo "============================================================"
echo ""
echo "📊 Summary:"
echo "  Platform:    $PLATFORM"
echo "  Build Time:  ${BUILD_TIME}s"
echo "  Image Size:  $IMAGE_SIZE"
echo "  Health:      $([ "$HEALTH_OK" = "true" ] && echo "✅ Passing" || echo "❌ Failed")"
echo ""
echo "============================================================"
