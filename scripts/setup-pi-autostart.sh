#!/bin/bash
# =============================================================================
# Raspberry Pi Auto-Start Configuration
# =============================================================================
# This script configures the Raspberry Pi to automatically start Docker
# containers on system boot.
#
# Run this ONCE on the Pi after initial setup:
#   chmod +x scripts/setup-pi-autostart.sh
#   ./scripts/setup-pi-autostart.sh
# =============================================================================

set -e

echo "================================================"
echo "Configuring Pi Auto-Start"
echo "================================================"

# Check if running on Pi
if [ ! -d ~/sunny-stack ]; then
  echo "❌ Error: ~/sunny-stack directory not found"
  echo "Please run this script on the Raspberry Pi"
  exit 1
fi

# Check if .env.production exists
if [ ! -f ~/sunny-stack/.env.production ]; then
  echo "❌ Error: .env.production not found in ~/sunny-stack/"
  echo "Please create .env.production before configuring auto-start"
  exit 1
fi

echo "✅ Pre-flight checks passed"

# Enable Docker to start on boot
echo "🔧 Enabling Docker to start on boot..."
sudo systemctl enable docker
sudo systemctl start docker

echo "✅ Docker enabled"

# Create systemd service for sunny-stack containers
echo "🔧 Creating systemd service..."

sudo tee /etc/systemd/system/sunny-stack.service > /dev/null <<'EOF'
[Unit]
Description=Sunny Stack Discord Bot & PostgreSQL
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/sunny-stack
User=pi
Group=pi

# Start containers
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d

# Stop containers
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down

# Reload containers (for restart)
ExecReload=/usr/bin/docker compose -f docker-compose.prod.yml restart

# Restart policy
Restart=on-failure
RestartSec=10s

# Resource limits
TimeoutStartSec=300
TimeoutStopSec=120

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service created"

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable the service to start on boot
echo "🔧 Enabling sunny-stack service..."
sudo systemctl enable sunny-stack.service

echo "✅ Service enabled"

# Display service status
echo ""
echo "================================================"
echo "Service Status:"
echo "================================================"
sudo systemctl status sunny-stack.service --no-pager || true

echo ""
echo "================================================"
echo "✅ Auto-Start Configuration Complete"
echo "================================================"
echo ""
echo "Available commands:"
echo "  sudo systemctl start sunny-stack    # Start containers"
echo "  sudo systemctl stop sunny-stack     # Stop containers"
echo "  sudo systemctl restart sunny-stack  # Restart containers"
echo "  sudo systemctl status sunny-stack   # Check status"
echo ""
echo "Containers will now start automatically on Pi boot!"
echo ""
echo "To test, run: sudo reboot"
echo "After reboot, check: sudo systemctl status sunny-stack"
echo "================================================"
