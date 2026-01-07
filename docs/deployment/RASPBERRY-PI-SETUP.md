# Raspberry Pi Setup Guide

Complete guide for initial Raspberry Pi setup to host PostgreSQL database and Discord bot for Sunny Stack Portfolio.

**This is a one-time setup guide.** For ongoing deployments, see [PI-DEPLOYMENT.md](PI-DEPLOYMENT.md).

---

## Hardware Requirements

### Recommended Configuration

| Component   | Specification            | Notes                                  |
| ----------- | ------------------------ | -------------------------------------- |
| **Model**   | Raspberry Pi 4B or 5     | Pi 4B 4GB minimum, 8GB recommended     |
| **Storage** | 32GB+ microSD or SSD     | SSD strongly recommended for database  |
| **Power**   | Official Pi Power Supply | 5V 3A USB-C (Pi 4), 5V 5A USB-C (Pi 5) |
| **Cooling** | Heatsink + Fan           | Required for 24/7 operation            |
| **Network** | Ethernet (preferred)     | Wi-Fi works but less stable            |
| **Case**    | Ventilated case          | Ensures proper cooling                 |

### Minimum Configuration

- **Model:** Raspberry Pi 4B (4GB RAM)
- **Storage:** 32GB microSD (Class 10 or better)
- **Power:** Official power supply or quality USB-C charger (3A)
- **Network:** Ethernet or Wi-Fi

**⚠️ Warning:** Running PostgreSQL on microSD without SSD will degrade performance and lifespan. Use SSD for production.

### Optional Accessories

- **UPS/Battery Backup:** Prevents database corruption during power outages
- **External SSD:** Better performance and longevity than microSD
- **Keyboard/Mouse:** For initial setup (can be removed after SSH enabled)
- **Monitor/HDMI Cable:** For initial setup (can be removed after SSH enabled)

---

## Operating System Installation

### Step 1: Download Raspberry Pi OS

**Recommended:** Raspberry Pi OS Lite (64-bit) - headless server without desktop

```bash
# Download from official site
https://www.raspberrypi.com/software/operating-systems/

# OR use Raspberry Pi Imager (easier)
https://www.raspberrypi.com/software/
```

**Why Lite?**

- No desktop GUI (saves RAM for database and bot)
- Smaller footprint (faster updates)
- Optimized for server workloads

### Step 2: Flash OS to SD Card/SSD

**Using Raspberry Pi Imager (Recommended):**

1. Download and install Raspberry Pi Imager
2. Insert microSD card (or connect SSD)
3. Click "Choose OS" → "Raspberry Pi OS (other)" → "Raspberry Pi OS Lite (64-bit)"
4. Click "Choose Storage" → Select your SD card/SSD
5. Click gear icon ⚙️ for advanced options:
   - **Set hostname:** `raspberrypi` (or custom name)
   - **Enable SSH:** ✅ Use password authentication
   - **Set username/password:** `pi` / [your password]
   - **Configure Wi-Fi:** (optional if using Ethernet)
   - **Set locale:** Your timezone and keyboard layout
6. Click "Write" and wait for completion

**Manual Method (Alternative):**

```bash
# Download image
wget https://downloads.raspberrypi.org/raspios_lite_arm64/images/...

# Flash to SD card (replace /dev/sdX with your device)
sudo dd if=2024-xx-xx-raspios-lite-arm64.img of=/dev/sdX bs=4M status=progress
sync

# Create empty SSH file to enable SSH on boot
touch /media/[user]/boot/ssh
```

### Step 3: First Boot

1. Insert SD card/connect SSD to Pi
2. Connect Ethernet cable (or ensure Wi-Fi is configured)
3. Connect power supply
4. Wait 30-60 seconds for boot

---

## Initial Configuration

### Step 4: Connect via SSH

**Find Pi IP address:**

```bash
# Method 1: Router admin panel
# Check DHCP client list for "raspberrypi"

# Method 2: Network scan (from your computer)
# Windows (requires arp-scan installation)
arp -a | findstr "b8-27-eb\|dc-a6-32\|e4-5f-01"

# Linux/macOS
arp -a | grep -E "b8:27:eb|dc:a6:32|e4:5f:01"

# Method 3: Use hostname (if mDNS works)
# raspberrypi.local
```

**Connect via SSH:**

```bash
# Default credentials (if you didn't change them)
ssh pi@raspberrypi.local
# OR
ssh pi@[IP-ADDRESS]

# Example:
ssh pi@192.168.1.100

# Password: (the one you set during imaging)
```

### Step 5: Update System

```bash
# Update package lists
sudo apt update

# Upgrade all packages (may take 10-20 minutes)
sudo apt full-upgrade -y

# Clean up
sudo apt autoremove -y
sudo apt autoclean

# Reboot to apply updates
sudo reboot
```

**Wait 60 seconds, then reconnect:**

```bash
ssh pi@raspberrypi.local
```

### Step 6: Configure System Settings

```bash
# Open Raspberry Pi configuration tool
sudo raspi-config
```

**Recommended settings:**

1. **System Options** → **Boot / Auto Login** → Console (no auto-login)
2. **Interface Options** → **SSH** → Enable (already enabled)
3. **Performance Options** → **GPU Memory** → 16 (minimum for headless)
4. **Localisation Options** → Set timezone, keyboard, locale
5. **Advanced Options** → **Expand Filesystem** → Yes
6. **Finish** → Reboot

---

## Security Hardening

### Step 7: Change Default Password

```bash
# Change password for user 'pi'
passwd

# Enter current password
# Enter new password (twice)
```

**Password Requirements:**

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Not easily guessable

### Step 8: Setup SSH Keys (Recommended)

**On your local machine:**

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to Pi
ssh-copy-id pi@raspberrypi.local

# Test SSH key authentication
ssh pi@raspberrypi.local
# Should log in without password
```

**Disable password authentication (optional but recommended):**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Find and modify these lines:
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart SSH service
sudo systemctl restart sshd
```

### Step 9: Setup Firewall (UFW)

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH (IMPORTANT: Do this BEFORE enabling firewall)
sudo ufw allow 22/tcp comment 'SSH'

# Allow PostgreSQL from Vercel IPs (will configure later)
sudo ufw allow 5432/tcp comment 'PostgreSQL'

# Allow bot health check (optional, for external monitoring)
sudo ufw allow 8080/tcp comment 'Bot Health'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

**Output should show:**

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere                   # SSH
5432/tcp                   ALLOW       Anywhere                   # PostgreSQL
8080/tcp                   ALLOW       Anywhere                   # Bot Health
```

### Step 10: Install Fail2Ban (SSH brute-force protection)

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Find [sshd] section and verify:
[sshd]
enabled = true
port = ssh
maxretry = 5
bantime = 3600

# Save and exit (Ctrl+O, Enter, Ctrl+X)

# Start and enable Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status sshd
```

---

## Network Configuration

### Step 11: Set Static IP Address

**Why?** Ensures Pi always has same IP for database connections.

```bash
# Find current IP configuration
ip addr show

# Edit dhcpcd configuration
sudo nano /etc/dhcpcd.conf

# Add to end of file (adjust for your network):
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8

# For Wi-Fi, use wlan0 instead:
# interface wlan0
# static ip_address=192.168.1.100/24
# static routers=192.168.1.1
# static domain_name_servers=192.168.1.1 8.8.8.8

# Save and exit (Ctrl+O, Enter, Ctrl+X)

# Reboot to apply
sudo reboot
```

**Verify static IP after reboot:**

```bash
ssh pi@192.168.1.100
ip addr show
```

### Step 12: Configure Port Forwarding (If Using Remote Access)

**If Vercel needs to access database from outside your network:**

1. **Log in to your router admin panel** (usually http://192.168.1.1)
2. **Find Port Forwarding settings** (varies by router)
3. **Add port forwarding rule:**
   - **Service Name:** PostgreSQL
   - **External Port:** 5432
   - **Internal IP:** 192.168.1.100 (Pi's static IP)
   - **Internal Port:** 5432
   - **Protocol:** TCP
4. **Save and apply**

**⚠️ Security Warning:** Only forward port 5432 if you need external access. Consider using a VPN or SSH tunnel instead.

**Alternative: SSH Tunnel (More Secure):**

```bash
# From Vercel, connect via SSH tunnel
ssh -L 5432:localhost:5432 pi@your-public-ip

# Then connect to localhost:5432
```

---

## Docker Installation

### Step 13: Install Docker Engine

```bash
# Download Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Run installation script
sudo sh get-docker.sh

# Add user to docker group (no sudo needed)
sudo usermod -aG docker pi

# Verify installation
docker --version

# Test Docker
docker run hello-world
```

**Expected output:**

```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### Step 14: Install Docker Compose

```bash
# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installation
docker compose version

# Expected: Docker Compose version v2.x.x
```

### Step 15: Configure Docker for Production

```bash
# Enable Docker service on boot
sudo systemctl enable docker

# Start Docker service
sudo systemctl start docker

# Configure Docker daemon for resource limits
sudo nano /etc/docker/daemon.json
```

**Add the following configuration:**

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-address-pools": [
    {
      "base": "172.17.0.0/16",
      "size": 24
    }
  ]
}
```

**Save and restart Docker:**

```bash
# Save file (Ctrl+O, Enter, Ctrl+X)

# Restart Docker
sudo systemctl restart docker

# Verify configuration
docker info | grep -i log
```

---

## Project Setup

### Step 16: Clone Repository

```bash
# Install Git (if not already installed)
sudo apt install git -y

# Create project directory
mkdir -p ~/projects
cd ~/projects

# Clone repository
git clone https://github.com/[your-username]/sunny-stack.git
cd sunny-stack

# Verify repository
ls -la
```

### Step 17: Configure Environment Variables

```bash
# Create production environment file
cp .env.example .env.production

# Edit environment file
nano .env.production
```

**Required environment variables:**

```bash
# Database Configuration
POSTGRES_USER=sunnystack
POSTGRES_PASSWORD=[generate-strong-password]
POSTGRES_DB=sunnystack
DATABASE_URL=postgresql://sunnystack:[password]@postgres:5432/sunnystack?connection_limit=20

# Discord Bot Configuration
DISCORD_BOT_TOKEN=[your-bot-token]
DISCORD_APPLICATION_ID=[your-app-id]
DISCORD_PUBLIC_KEY=[your-public-key]
DISCORD_GUILD_ID=[your-guild-id]
DISCORD_ADMIN_USER_ID=[your-user-id]

# Discord Channel IDs
DISCORD_CHANNEL_ADMIN_LOGS=[channel-id]
DISCORD_CHANNEL_BOT_COMMANDS=[channel-id]
DISCORD_CHANNEL_ACTIVE_PROJECTS=[channel-id]

# Bot API Configuration
BOT_API_URL=https://sunny-stack.com
BOT_API_SECRET=[generate-strong-secret]

# Node Environment
NODE_ENV=production
DEPLOYMENT_MODE=pi
```

**Save file** (Ctrl+O, Enter, Ctrl+X)

**⚠️ Security:** Never commit `.env.production` to Git. It's already in `.gitignore`.

---

## Initial Database Setup

### Step 18: Start PostgreSQL Container

```bash
# Navigate to project directory
cd ~/projects/sunny-stack

# Start PostgreSQL only (not bot yet)
docker compose up -d postgres

# Wait 30 seconds for startup
sleep 30

# Check container status
docker compose ps

# View logs
docker compose logs postgres
```

**Expected output:**

```
sunny-stack-db  postgres  running  0.0.0.0:5432->5432/tcp
```

### Step 19: Initialize Database Schema

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Verify database
docker compose exec postgres psql -U sunnystack sunnystack -c "\dt"
```

**Expected output:** List of tables (projects, quotes, users, etc.)

### Step 20: Seed Database (Optional)

```bash
# If you have seed data
npx prisma db seed

# Or manually insert test data
docker compose exec postgres psql -U sunnystack sunnystack
```

---

## Health Monitoring Setup

### Step 21: Configure Automated Backups

```bash
# Create backup directory
mkdir -p ~/backups/postgres

# Create backup script
nano ~/backups/backup-postgres.sh
```

**Backup script content:**

```bash
#!/bin/bash

# Configuration
BACKUP_DIR=~/backups/postgres
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sunnystack_backup_${DATE}.sql"
RETENTION_DAYS=30

# Create backup
docker compose -f ~/projects/sunny-stack/docker-compose.yml exec -T postgres \
  pg_dump -U sunnystack sunnystack > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Delete backups older than retention period
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Log backup
echo "$(date): Backup completed - ${BACKUP_FILE}.gz" >> "${BACKUP_DIR}/backup.log"
```

**Make script executable:**

```bash
chmod +x ~/backups/backup-postgres.sh

# Test backup
~/backups/backup-postgres.sh

# Verify backup created
ls -lh ~/backups/postgres/
```

### Step 22: Schedule Automated Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/pi/backups/backup-postgres.sh

# Save and exit
```

**Verify cron job:**

```bash
crontab -l
```

### Step 23: Setup Disk Space Monitoring

```bash
# Create monitoring script
nano ~/scripts/check-disk-space.sh
```

**Monitoring script content:**

```bash
#!/bin/bash

THRESHOLD=80
USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "WARNING: Disk usage is at ${USAGE}%"
  # Add Discord notification here (optional)
fi
```

**Make executable and schedule:**

```bash
chmod +x ~/scripts/check-disk-space.sh

# Add to crontab (every 6 hours)
crontab -e

# Add line:
0 */6 * * * /home/pi/scripts/check-disk-space.sh
```

---

## Performance Optimization

### Step 24: Configure Swap Memory

**Raspberry Pi 4GB should have at least 2GB swap for database:**

```bash
# Check current swap
free -h

# Disable current swap
sudo dphys-swapfile swapoff

# Edit swap configuration
sudo nano /etc/dphys-swapfile

# Set swap size (2048MB = 2GB)
CONF_SWAPSIZE=2048

# Save and exit

# Recreate swap file
sudo dphys-swapfile setup

# Enable swap
sudo dphys-swapfile swapon

# Verify
free -h
```

### Step 25: Optimize Boot Configuration

```bash
# Edit boot config
sudo nano /boot/config.txt

# Add/modify these lines:
gpu_mem=16                # Minimal GPU memory (headless server)
dtoverlay=disable-wifi    # Disable Wi-Fi if using Ethernet
dtoverlay=disable-bt      # Disable Bluetooth (not needed)

# Save and reboot
sudo reboot
```

---

## Verification & Testing

### Step 26: System Verification

```bash
# Check system resources
htop

# Expected:
# - CPU usage: < 30% idle
# - Memory usage: < 50% with database running
# - Swap usage: < 500MB
```

```bash
# Check disk space
df -h

# Expected: > 10GB free space
```

```bash
# Check Docker status
docker compose ps

# Expected: postgres container running
```

```bash
# Test database connection
docker compose exec postgres psql -U sunnystack sunnystack -c "SELECT NOW();"

# Expected: Current timestamp
```

### Step 27: External Access Test (If Configured)

```bash
# From another machine on your network
psql -h 192.168.1.100 -U sunnystack -d sunnystack

# Or test with pg_isready
pg_isready -h 192.168.1.100 -U sunnystack
```

---

## Troubleshooting

### Issue: Cannot SSH to Pi

**Check:**

```bash
# From router: Find Pi IP address
# Try both hostname and IP:
ssh pi@raspberrypi.local
ssh pi@192.168.1.100

# Verify SSH is enabled
# Re-flash SD card and enable SSH in imager settings
```

### Issue: Docker Permissions Denied

**Fix:**

```bash
# Add user to docker group
sudo usermod -aG docker pi

# Log out and log back in
exit
ssh pi@raspberrypi.local

# Test
docker ps
```

### Issue: Database Won't Start

**Check logs:**

```bash
docker compose logs postgres

# Common issues:
# - Port 5432 already in use
# - Insufficient memory
# - Corrupted data volume
```

**Reset database (DESTRUCTIVE):**

```bash
docker compose down
docker volume rm sunny-stack_postgres-data
docker compose up -d postgres
npx prisma migrate deploy
```

### Issue: Disk Space Full

**Clean up:**

```bash
# Remove old Docker images
docker system prune -a

# Remove old log files
sudo journalctl --vacuum-time=7d

# Check large files
du -h / | sort -h | tail -20
```

---

## Maintenance Schedule

### Daily

- Automated database backup (2 AM cron job)
- Disk space monitoring (every 6 hours)

### Weekly

- Check system logs: `sudo journalctl -p err -S today`
- Review Docker logs: `docker compose logs --tail=100`
- Verify backups: `ls -lh ~/backups/postgres/`

### Monthly

- Update system packages: `sudo apt update && sudo apt upgrade`
- Check disk health: `sudo smartctl -a /dev/sda` (if SSD)
- Test backup restoration
- Review firewall logs: `sudo ufw status`

### Quarterly

- Full system audit
- Update Docker images
- Review security settings
- Test disaster recovery procedures

---

## Next Steps

Once Pi is fully configured:

1. **Deploy Discord Bot**: See [PI-DEPLOYMENT.md](PI-DEPLOYMENT.md)
2. **Setup CI/CD**: See [GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md)
3. **Configure Vercel**: Update Vercel environment variables with Pi database URL

---

## Related Documentation

- **[Deployment Overview](DEPLOYMENT-OVERVIEW.md)** - Overall deployment strategy
- **[Pi Deployment](PI-DEPLOYMENT.md)** - Ongoing deployment procedures
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

**Setup Time:** 2-3 hours (experienced), 4-5 hours (first time)
**Last Updated:** 2026-01-07
**Raspberry Pi OS Version:** Raspberry Pi OS Lite (64-bit) Bookworm
**Maintained by:** Sunny Stack Development Team
