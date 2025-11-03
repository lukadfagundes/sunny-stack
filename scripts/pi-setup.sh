#!/bin/bash
# =============================================================================
# Raspberry Pi Setup Script for Sunny Stack Discord Bot
# =============================================================================
# This script automates the setup of a Raspberry Pi 4B for hosting
# the Discord bot in a Docker container.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/yourusername/sunny-stack/main/scripts/pi-setup.sh | bash
#
# Or download and run locally:
#   chmod +x pi-setup.sh
#   ./pi-setup.sh
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
  echo -e "\n${BLUE}==>${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  log_error "Do not run this script as root. Run as regular user (pi)."
  exit 1
fi

log_step "Sunny Stack Discord Bot - Raspberry Pi Setup"
echo "This script will install and configure:"
echo "  - Docker and Docker Compose"
echo "  - Bot directory structure"
echo "  - Environment file template"
echo "  - Systemd service for auto-start"
echo "  - Log rotation"
echo "  - Firewall rules (if UFW available)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log_info "Setup cancelled by user"
  exit 0
fi

# -----------------------------------------------------------------------------
# 1. System Update
# -----------------------------------------------------------------------------
log_step "Step 1/10: Updating system packages"
log_info "This may take a few minutes..."
sudo apt update -qq
sudo apt upgrade -y -qq
sudo apt install -y git curl wget vim htop

log_info "System updated successfully"

# -----------------------------------------------------------------------------
# 2. Docker Installation
# -----------------------------------------------------------------------------
log_step "Step 2/10: Installing Docker"

if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  log_warn "Docker is already installed: $DOCKER_VERSION"
else
  log_info "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh

  log_info "Adding user to docker group..."
  sudo usermod -aG docker $USER

  log_info "Docker installed successfully"
  log_warn "You need to log out and log back in for docker group changes to take effect"
  log_warn "After logging back in, run 'docker ps' to verify Docker access"
fi

# -----------------------------------------------------------------------------
# 3. Docker Compose Installation
# -----------------------------------------------------------------------------
log_step "Step 3/10: Installing Docker Compose"

if command -v docker-compose &> /dev/null; then
  COMPOSE_VERSION=$(docker-compose --version)
  log_warn "Docker Compose is already installed: $COMPOSE_VERSION"
else
  log_info "Installing Docker Compose..."
  sudo apt install -y docker-compose
  log_info "Docker Compose installed successfully"
fi

# -----------------------------------------------------------------------------
# 4. Directory Setup
# -----------------------------------------------------------------------------
log_step "Step 4/10: Creating bot directory structure"

BOT_DIR="$HOME/sunny-stack-bot"
mkdir -p "$BOT_DIR"
cd "$BOT_DIR"

log_info "Bot directory created: $BOT_DIR"

# Create logs directory
mkdir -p logs

log_info "Created subdirectories: logs/"

# -----------------------------------------------------------------------------
# 5. Environment File Setup
# -----------------------------------------------------------------------------
log_step "Step 5/10: Setting up environment file template"

if [ -f ".env.production" ]; then
  log_warn ".env.production already exists. Creating backup..."
  cp .env.production ".env.production.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > .env.production << 'EOF'
# =============================================================================
# Sunny Stack Discord Bot - Production Environment
# =============================================================================
# This file is created by pi-setup.sh
# Fill in your actual values or use sync-env-to-pi.sh to sync from local
# =============================================================================

# Discord Bot Configuration (Required)
DISCORD_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_GUILD_ID=
DISCORD_ADMIN_USER_ID=

# Discord Channel IDs (Required)
DISCORD_CHANNEL_ADMIN_LOGS=
DISCORD_CHANNEL_BOT_COMMANDS=
DISCORD_CHANNEL_ACTIVE_PROJECTS=
DISCORD_CHANNEL_PROPOSALS=
DISCORD_CHANNEL_TASKS=
DISCORD_CHANNEL_TIME_TRACKING=
DISCORD_CHANNEL_CLIENT_INQUIRIES=
DISCORD_CHANNEL_CLIENT_UPDATES=
DISCORD_CHANNEL_CALENDAR_SYNC=
DISCORD_CHANNEL_EMAIL_NOTIFICATIONS=
DISCORD_CHANNEL_ANALYTICS=
DISCORD_CHANNEL_INVOICES=
DISCORD_CHANNEL_PAYMENTS=

# Database Configuration (Required)
DATABASE_URL=
DATABASE_URL_UNPOOLED=
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Bot API Configuration (Required)
BOT_API_KEY=
BOT_API_URL=https://sunny-stack.com/api

# Deployment Configuration
DEPLOYMENT_MODE=pi
NODE_ENV=production
HEALTH_PORT=8080

# Optional: Debug Mode
DEBUG=false
EOF

chmod 600 .env.production

log_info ".env.production created (empty template)"
log_warn "You must fill in environment variables before deployment!"
log_info "Use: nano .env.production"
log_info "Or: ./scripts/sync-env-to-pi.sh (from development machine)"

# -----------------------------------------------------------------------------
# 6. Docker Compose File
# -----------------------------------------------------------------------------
log_step "Step 6/10: Creating docker-compose.prod.yml"

# Detect GitHub username from git config or prompt
GITHUB_USERNAME=$(git config --get user.name 2>/dev/null || echo "GITHUB_USERNAME")

cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  discord-bot:
    image: ghcr.io/${GITHUB_USERNAME}/sunny-stack/discord-bot:latest
    container_name: sunny-stack-bot
    restart: unless-stopped

    env_file:
      - .env.production

    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

    ports:
      - "8080:8080"

    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1.5G
        reservations:
          cpus: '0.5'
          memory: 512M

    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
        compress: "true"

    security_opt:
      - no-new-privileges:true

    user: "1001:1001"

    networks:
      - sunny-stack-network

networks:
  sunny-stack-network:
    driver: bridge
EOF

log_info "docker-compose.prod.yml created"
log_warn "Update GITHUB_USERNAME in docker-compose.prod.yml if needed"
log_info "Current value: $GITHUB_USERNAME"

# -----------------------------------------------------------------------------
# 7. Systemd Service (Optional - for auto-start on boot)
# -----------------------------------------------------------------------------
log_step "Step 7/10: Creating systemd service for auto-start"

sudo tee /etc/systemd/system/sunny-stack-bot.service > /dev/null << EOF
[Unit]
Description=Sunny Stack Discord Bot
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$BOT_DIR
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable sunny-stack-bot.service

log_info "Systemd service created and enabled"
log_info "Bot will auto-start on system boot"
log_info "Manual control: sudo systemctl {start|stop|restart|status} sunny-stack-bot"

# -----------------------------------------------------------------------------
# 8. Log Rotation
# -----------------------------------------------------------------------------
log_step "Step 8/10: Setting up log rotation"

sudo tee /etc/logrotate.d/sunny-stack-bot > /dev/null << EOF
$BOT_DIR/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0644 $USER $USER
}
EOF

log_info "Log rotation configured (daily, keep 7 days)"

# -----------------------------------------------------------------------------
# 9. Firewall Configuration
# -----------------------------------------------------------------------------
log_step "Step 9/10: Configuring firewall"

if command -v ufw &> /dev/null; then
  log_info "UFW detected, adding firewall rules..."
  sudo ufw allow 22/tcp comment "SSH" || true
  sudo ufw allow 8080/tcp comment "Bot Health Endpoint" || true
  log_info "Firewall rules added (SSH + Health endpoint)"
else
  log_warn "UFW not installed. Firewall configuration skipped."
  log_info "Install with: sudo apt install ufw"
fi

# -----------------------------------------------------------------------------
# 10. Final Checks
# -----------------------------------------------------------------------------
log_step "Step 10/10: Running final checks"

# Check Docker
if docker --version &> /dev/null; then
  log_info "✅ Docker: $(docker --version)"
else
  log_error "❌ Docker not working"
fi

# Check Docker Compose
if docker-compose --version &> /dev/null; then
  log_info "✅ Docker Compose: $(docker-compose --version)"
else
  log_error "❌ Docker Compose not working"
fi

# Check directory
if [ -d "$BOT_DIR" ]; then
  log_info "✅ Bot directory: $BOT_DIR"
else
  log_error "❌ Bot directory not created"
fi

# Check env file
if [ -f "$BOT_DIR/.env.production" ]; then
  log_info "✅ Environment file: .env.production"
else
  log_error "❌ Environment file not created"
fi

# Check systemd service
if systemctl is-enabled sunny-stack-bot.service &> /dev/null; then
  log_info "✅ Systemd service: enabled"
else
  log_warn "⚠️  Systemd service: not enabled"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "✅ Raspberry Pi Setup Complete!"
echo "============================================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Log out and log back in (for docker group changes)"
echo "   Command: exit"
echo ""
echo "2️⃣  Fill in environment variables in .env.production"
echo "   Command: nano ~/sunny-stack-bot/.env.production"
echo "   Or sync from dev machine: ./scripts/sync-env-to-pi.sh"
echo ""
echo "3️⃣  Update GITHUB_USERNAME in docker-compose.prod.yml"
echo "   Command: nano ~/sunny-stack-bot/docker-compose.prod.yml"
echo "   Current value: $GITHUB_USERNAME"
echo ""
echo "4️⃣  Authenticate to GitHub Container Registry"
echo "   Command: echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
echo ""
echo "5️⃣  Test deployment manually"
echo "   Command: cd ~/sunny-stack-bot && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "6️⃣  Check health endpoint"
echo "   Command: curl http://localhost:8080/health"
echo ""
echo "7️⃣  View logs"
echo "   Command: docker logs sunny-stack-bot -f"
echo ""
echo "============================================================"
echo "📚 Documentation: https://github.com/yourusername/sunny-stack"
echo "❓ Issues: https://github.com/yourusername/sunny-stack/issues"
echo "============================================================"
echo ""
