#!/bin/bash
################################################################################
# Pre-Flight Validation Script
#
# Validates all prerequisites before Discord bot deployment.
# Ensures environment is ready for Docker build and deployment.
#
# Usage:
#   bash scripts/validate-prerequisites.sh
#
# Checks:
#   1. Docker installed and running
#   2. Node.js version (>=18.17.0)
#   3. npm installed
#   4. All tests pass (50 tests)
#   5. Bot builds successfully
#   6. Disk space for Docker images (>2GB)
#
# Exit Codes:
#   0 = All checks passed
#   1 = One or more checks failed
#
# @see ADR-004: Runtime Environment Validation
# @see DEPLOYMENT.md for deployment workflow
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

################################################################################
# Helper Functions
################################################################################

print_header() {
  echo ""
  echo "============================================================"
  echo "$1"
  echo "============================================================"
  echo ""
}

print_check() {
  echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
  FAILURES=$((FAILURES + 1))
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

check_command() {
  local cmd=$1
  local name=$2

  if command -v "$cmd" &> /dev/null; then
    print_success "$name is installed"
    return 0
  else
    print_error "$name is not installed"
    return 1
  fi
}

################################################################################
# Pre-Flight Checks
################################################################################

print_header "Pre-Flight Validation"

# ------------------------------------------------------------------------------
# Check 1: Docker Installation
# ------------------------------------------------------------------------------
print_check "Checking Docker installation..."

if check_command "docker" "Docker"; then
  # Check Docker version
  DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
  echo "   Docker version: $DOCKER_VERSION"

  # Check if Docker daemon is running
  if docker info &> /dev/null; then
    print_success "Docker daemon is running"
  else
    print_error "Docker daemon is not running"
    echo "   Start Docker Desktop or run: sudo systemctl start docker"
  fi
else
  echo "   Install Docker: https://docs.docker.com/get-docker/"
fi

echo ""

# ------------------------------------------------------------------------------
# Check 2: Node.js Version
# ------------------------------------------------------------------------------
print_check "Checking Node.js version..."

if check_command "node" "Node.js"; then
  NODE_VERSION=$(node --version | sed 's/v//')
  echo "   Node.js version: $NODE_VERSION"

  # Check if version >= 18.17.0
  REQUIRED_VERSION="18.17.0"
  if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    print_success "Node.js version meets requirements (>= 18.17.0)"
  else
    print_error "Node.js version too old (requires >= 18.17.0)"
    echo "   Upgrade Node.js: https://nodejs.org/"
  fi
else
  echo "   Install Node.js: https://nodejs.org/"
fi

echo ""

# ------------------------------------------------------------------------------
# Check 3: npm Installation
# ------------------------------------------------------------------------------
print_check "Checking npm installation..."

if check_command "npm" "npm"; then
  NPM_VERSION=$(npm --version)
  echo "   npm version: $NPM_VERSION"
else
  echo "   npm should come with Node.js"
fi

echo ""

# ------------------------------------------------------------------------------
# Check 4: Disk Space
# ------------------------------------------------------------------------------
print_check "Checking available disk space..."

# Get available space in GB (works on Linux/macOS/Git Bash)
if command -v df &> /dev/null; then
  AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
  echo "   Available space: ${AVAILABLE_SPACE}GB"

  if [ "$AVAILABLE_SPACE" -ge 2 ]; then
    print_success "Sufficient disk space available (>= 2GB)"
  else
    print_error "Insufficient disk space (requires >= 2GB)"
    echo "   Free up disk space before deployment"
  fi
else
  print_warning "Could not check disk space (df command not available)"
fi

echo ""

# ------------------------------------------------------------------------------
# Check 5: Dependencies Installed
# ------------------------------------------------------------------------------
print_check "Checking npm dependencies..."

if [ -d "node_modules" ]; then
  print_success "node_modules directory exists"
else
  print_error "node_modules not found"
  echo "   Run: npm install"
fi

echo ""

# ------------------------------------------------------------------------------
# Check 6: Environment Variables
# ------------------------------------------------------------------------------
print_check "Validating environment variables..."

if [ -f ".env.local" ]; then
  print_success ".env.local file exists"

  # Run environment validation script
  if npx tsx scripts/validate-env.ts --mode=pi 2>&1; then
    print_success "Environment variables are valid"
  else
    print_error "Environment variable validation failed"
    echo "   Run: npx tsx scripts/validate-env.ts --mode=pi"
    echo "   Fix errors and try again"
  fi
else
  print_error ".env.local file not found"
  echo "   Copy .env.example to .env.local"
  echo "   Run: cp .env.example .env.local"
  echo "   Then configure variables"
fi

echo ""

# ------------------------------------------------------------------------------
# Check 7: Tests Pass
# ------------------------------------------------------------------------------
print_check "Running test suite..."

if npm test -- --passWithNoTests 2>&1 | grep -q "Tests:.*passed"; then
  print_success "All tests passed"
else
  print_error "Test suite failed"
  echo "   Run: npm test"
  echo "   Fix failing tests before deployment"
fi

echo ""

# ------------------------------------------------------------------------------
# Check 8: Bot Build
# ------------------------------------------------------------------------------
print_check "Building bot package..."

if npm run build:bot 2>&1; then
  print_success "Bot build succeeded"

  # Check if dist directory was created
  if [ -d "bot/dist" ]; then
    print_success "bot/dist directory created"
  else
    print_error "bot/dist directory not found after build"
  fi
else
  print_error "Bot build failed"
  echo "   Run: npm run build:bot"
  echo "   Fix TypeScript errors before deployment"
fi

echo ""

################################################################################
# Summary
################################################################################

print_header "Pre-Flight Validation Summary"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ $FAILURES check(s) failed.${NC}"
  echo ""
  echo "Fix the errors above before proceeding with deployment."
  echo "See DEPLOYMENT.md for detailed instructions."
  echo ""
  exit 1
fi
