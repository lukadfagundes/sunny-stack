#!/bin/bash
# =============================================================================
# Sync Environment Variables to Raspberry Pi
# =============================================================================
# Securely transfers .env.local to Pi as .env.production
# Uses SCP with SSH key authentication
#
# Usage:
#   ./scripts/sync-env-to-pi.sh [pi-host] [pi-user]
#
# Example:
#   ./scripts/sync-env-to-pi.sh raspberrypi.local pi
#   ./scripts/sync-env-to-pi.sh 192.168.1.100 pi
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
PI_HOST="${1:-raspberrypi.local}"
PI_USER="${2:-pi}"
PI_DIR="sunny-stack-bot"

echo "============================================================"
echo "Sunny Stack - Environment Sync to Raspberry Pi"
echo "============================================================"
echo ""
log_info "Target: $PI_USER@$PI_HOST:~/$PI_DIR/.env.production"
log_info "Source: .env.local (current directory)"
echo ""

# -----------------------------------------------------------------------------
# 1. Validate Local Environment File
# -----------------------------------------------------------------------------
log_step "Step 1/6: Validating local environment file"

if [ ! -f ".env.local" ]; then
  log_error ".env.local not found in current directory"
fi

# Count variables
VAR_COUNT=$(grep -c "^[^#].*=" .env.local || echo "0")
log_info "Found $VAR_COUNT environment variables in .env.local"

if [ "$VAR_COUNT" -lt 10 ]; then
  log_warn "Very few variables found ($VAR_COUNT). Is this correct?"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Sync cancelled by user"
  fi
fi

# Check for required variables
REQUIRED_VARS=("DISCORD_BOT_TOKEN" "DATABASE_URL" "BOT_API_KEY")
for VAR in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^${VAR}=" .env.local; then
    log_error "Required variable $VAR not found in .env.local"
  fi
done

log_info "✅ Required variables present"

# Check for secrets (warn if found in plaintext)
if grep -q "password\|secret\|key" .env.local | grep -v "^#"; then
  log_info "⚠️  Sensitive data detected (normal for .env files)"
fi

# -----------------------------------------------------------------------------
# 2. Validate with TypeScript (Optional)
# -----------------------------------------------------------------------------
log_step "Step 2/6: Running environment validation (optional)"

if command -v npx &> /dev/null && [ -f "scripts/validate-env.ts" ]; then
  log_info "Running TypeScript validation..."
  if npx tsx scripts/validate-env.ts --mode=pi 2>&1 | tee validation.log; then
    log_info "✅ Validation passed"
  else
    log_warn "⚠️  Validation failed. Check validation.log for details."
    read -p "Continue with sync anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_error "Sync cancelled due to validation failure"
    fi
  fi
else
  log_warn "Validation skipped (npx/tsx not available or validate-env.ts not found)"
fi

# -----------------------------------------------------------------------------
# 3. Test SSH Connection
# -----------------------------------------------------------------------------
log_step "Step 3/6: Testing SSH connection to Pi"

log_info "Connecting to $PI_USER@$PI_HOST..."

if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PI_USER@$PI_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
  log_info "✅ SSH connection successful"
else
  log_error "Cannot connect to Pi via SSH. Check:\n  - Pi is powered on and connected to network\n  - SSH is enabled on Pi\n  - Hostname/IP is correct: $PI_HOST\n  - SSH keys are set up (run: ssh-copy-id $PI_USER@$PI_HOST)"
fi

# -----------------------------------------------------------------------------
# 4. Backup Existing Environment on Pi
# -----------------------------------------------------------------------------
log_step "Step 4/6: Backing up existing .env.production on Pi"

log_info "Checking for existing environment file..."

ssh "$PI_USER@$PI_HOST" << 'EOF'
  if [ ! -d "~/sunny-stack-bot" ]; then
    echo "⚠️  Bot directory not found. Creating..."
    mkdir -p ~/sunny-stack-bot
  fi

  cd ~/sunny-stack-bot

  if [ -f ".env.production" ]; then
    BACKUP_FILE=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env.production "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
  else
    echo "ℹ️  No existing .env.production found (first-time setup)"
  fi
EOF

# -----------------------------------------------------------------------------
# 5. Copy Environment File to Pi
# -----------------------------------------------------------------------------
log_step "Step 5/6: Copying environment file to Pi"

log_info "Transferring .env.local -> Pi:.env.production..."

if scp -o ConnectTimeout=10 .env.local "$PI_USER@$PI_HOST:~/$PI_DIR/.env.production"; then
  log_info "✅ File transferred successfully"
else
  log_error "Failed to copy environment file via SCP"
fi

# Set correct permissions (600 = rw-------)
log_info "Setting secure permissions (600)..."
ssh "$PI_USER@$PI_HOST" "chmod 600 ~/$PI_DIR/.env.production"

log_info "✅ Permissions set to 600 (owner read/write only)"

# -----------------------------------------------------------------------------
# 6. Validate on Pi
# -----------------------------------------------------------------------------
log_step "Step 6/6: Validating environment on Pi"

log_info "Checking synced environment file..."

ssh "$PI_USER@$PI_HOST" << 'EOF'
  cd ~/sunny-stack-bot

  # Check file exists
  if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found after sync!"
    exit 1
  fi

  # Count non-empty, non-comment lines
  VAR_COUNT=$(grep -c "^[^#].*=" .env.production || echo "0")

  echo "✅ Environment file synced: $VAR_COUNT variables"

  # Check file permissions
  PERMS=$(stat -c "%a" .env.production 2>/dev/null || stat -f "%OLp" .env.production)
  echo "✅ File permissions: $PERMS"

  # List variable names (not values) for verification
  echo ""
  echo "📋 Variables present:"
  grep "^[^#].*=" .env.production | cut -d= -f1 | sort | sed 's/^/  ✓ /'
EOF

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "✅ Environment Variables Synced Successfully!"
echo "============================================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Test bot startup (SSH to Pi):"
echo "   ssh $PI_USER@$PI_HOST"
echo "   cd ~/sunny-stack-bot"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "2️⃣  Check health endpoint:"
echo "   curl http://$PI_HOST:8080/health"
echo ""
echo "3️⃣  View logs:"
echo "   ssh $PI_USER@$PI_HOST 'docker logs sunny-stack-bot -f'"
echo ""
echo "4️⃣  If issues occur, check logs:"
echo "   ssh $PI_USER@$PI_HOST 'docker logs sunny-stack-bot --tail=100'"
echo ""
echo "============================================================"
echo "ℹ️  Environment backups stored on Pi:"
echo "   Location: ~/$PI_DIR/.env.production.backup.*"
echo "============================================================"
echo ""
