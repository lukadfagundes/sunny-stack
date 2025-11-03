# Raspberry Pi Setup Guide

**Project:** Sunny Stack
**Target:** Raspberry Pi 4B (Discord Bot Deployment)
**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

- [Introduction](#introduction)
- [Hardware Requirements](#hardware-requirements)
  - [Required Hardware](#required-hardware)
  - [Recommended Hardware](#recommended-hardware)
  - [Optional Hardware](#optional-hardware)
- [Operating System Installation](#operating-system-installation)
  - [Download Raspberry Pi OS](#download-raspberry-pi-os)
  - [Flash Storage Drive](#flash-storage-drive)
  - [Initial Boot](#initial-boot)
- [System Configuration](#system-configuration)
  - [Update System](#update-system)
  - [Configure Localization](#configure-localization)
  - [Enable Services](#enable-services)
- [Docker Installation](#docker-installation)
  - [Install Docker](#install-docker)
  - [Configure Docker](#configure-docker)
  - [Verify Installation](#verify-installation)
- [SSH Configuration](#ssh-configuration)
  - [Enable SSH](#enable-ssh)
  - [Generate SSH Keys](#generate-ssh-keys)
  - [Configure Authorized Keys](#configure-authorized-keys)
  - [Secure SSH](#secure-ssh)
- [Environment Configuration](#environment-configuration)
  - [Create .env File](#create-env-file)
  - [Set Environment Variables](#set-environment-variables)
  - [Validate Configuration](#validate-configuration)
- [Network Configuration](#network-configuration)
  - [Static IP Setup](#static-ip-setup)
  - [Firewall Rules](#firewall-rules)
  - [Port Forwarding](#port-forwarding)
- [Security Hardening](#security-hardening)
  - [System Updates](#system-updates)
  - [User Management](#user-management)
  - [SSH Security](#ssh-security)
  - [Fail2Ban](#fail2ban)
- [Deployment Preparation](#deployment-preparation)
  - [Clone Repository](#clone-repository)
  - [Install Dependencies](#install-dependencies)
  - [Build Application](#build-application)
- [References](#references)

---

## Introduction

This guide walks you through setting up a Raspberry Pi 4B for hosting the Sunny Stack Discord bot. The bot runs in a Docker container with health monitoring and automatic restart capabilities.

### Why Raspberry Pi?

- **Cost-effective**: Self-hosted solution with low power consumption
- **Always-on**: Reliable 24/7 operation for Discord bot
- **Independence**: Separate from Next.js frontend on Vercel
- **Control**: Full control over deployment environment

---

## Hardware Requirements

### Required Hardware

| Component           | Specification      | Purpose            |
| ------------------- | ------------------ | ------------------ |
| **Raspberry Pi 4B** | 4GB RAM (minimum)  | Bot host           |
| **microSD Card**    | 32GB+ Class 10     | Operating system   |
| **Power Supply**    | Official 15W USB-C | Stable power       |
| **Ethernet Cable**  | Cat5e or better    | Network connection |

### Recommended Hardware

| Component           | Specification      | Benefit            |
| ------------------- | ------------------ | ------------------ |
| **Raspberry Pi 4B** | 8GB RAM            | Better performance |
| **microSD Card**    | 64GB+ A1/A2 rated  | Faster I/O         |
| **Case**            | With fan/heatsinks | Better cooling     |
| **UPS/Battery**     | Pi UPS HAT         | Power backup       |

### Optional Hardware

- **SSD** via USB 3.0 (for faster disk I/O)
- **Cooling fan** (for sustained high load)
- **Status LEDs** (for visual monitoring)

---

## Operating System Installation

> **NOTE FOR EXISTING INSTALLATIONS**: If your Raspberry Pi 4B is already running with Raspberry Pi OS on a USB SSD (32GB or larger), you can **skip this entire section** and proceed directly to [SSH Configuration](#ssh-configuration) to reset your SSH credentials.

### Download Raspberry Pi OS

**Recommended:** Raspberry Pi OS Lite (64-bit)

1. Download Raspberry Pi Imager: https://www.raspberrypi.com/software/
2. Select OS: **Raspberry Pi OS Lite (64-bit)**
   - No desktop environment (headless operation)
   - Smaller footprint
   - Better performance for server workloads

### Flash Storage Drive

**Using Raspberry Pi Imager** (Recommended):

> **IMPORTANT**: If you're using a USB SSD as a boot drive (like a 32GB USB SSD), select the USB drive as the storage target instead of a microSD card. The Pi 4B supports USB boot natively.

1. Insert storage device (microSD card or USB SSD) into computer
2. Open Raspberry Pi Imager
3. Click "CHOOSE OS" > Raspberry Pi OS (other) > **Raspberry Pi OS Lite (64-bit)**
4. Click "CHOOSE STORAGE" > Select your storage device (microSD or USB SSD)
5. Click gear icon ⚙️ for advanced options:
   - **Enable SSH**: YES (use password authentication initially)
   - **Set username and password**: `pi` / your-secure-password
   - **Configure wireless LAN**: (if using WiFi)
     - SSID: Your WiFi network name
     - Password: Your WiFi password
     - Wireless LAN country: Your country code
   - **Set locale settings**: Your timezone and keyboard layout
6. Click "WRITE" and wait for completion (5-10 minutes)
7. Eject storage device safely

**Using command line (Linux/Mac):**

```bash
# Download image
wget https://downloads.raspberrypi.org/raspios_lite_arm64/images/[latest].img.xz

# Extract
xz -d [image].img.xz

# Flash (replace /dev/sdX with your storage device)
# WARNING: Double-check device name - this will erase all data!
sudo dd if=[image].img of=/dev/sdX bs=4M status=progress && sync
```

### Initial Boot

> **SKIP THIS SECTION** if your Pi is already running and you just need to reset SSH credentials.

1. **Insert storage device** into Raspberry Pi (microSD slot or USB 3.0 port)
2. **Connect Ethernet** cable (or use configured WiFi)
3. **Connect power** supply
4. **Wait** 30-60 seconds for first boot (USB boot may take up to 2 minutes)
5. **Find Pi on network**:

   ```bash
   # Try default hostname
   ping raspberrypi.local

   # Or scan network
   nmap -sn 192.168.1.0/24 | grep -B 2 "Raspberry"

   # Or check router's connected devices
   ```

6. **SSH into Pi**:
   ```bash
   ssh pi@raspberrypi.local
   # Enter password you set during imaging
   ```

### USB Boot Notes

If you're using a USB SSD as a boot drive:

- **Pi 4B** supports USB boot natively (no additional configuration needed)
- **Performance**: USB 3.0 SSD is significantly faster than microSD for Docker workloads
- **Reliability**: SSDs are more reliable than microSD cards for 24/7 operation
- **Boot order**: Pi 4B will automatically detect and boot from USB if no microSD is present
- **Recommended**: Always use USB 3.0 port (blue port) for best performance

---

## System Configuration

### Update System

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl wget vim
```

### Configure Localization

**Already configured** if you used Raspberry Pi Imager advanced options.

If needed, configure manually:

```bash
sudo raspi-config
# 5 Localisation Options
#   L1 Locale > en_US.UTF-8 UTF-8
#   L2 Timezone > Your timezone
#   L3 Keyboard > Your layout
#   L4 WLAN Country > Your country
```

### Enable Services

SSH is already enabled if configured during imaging. Verify:

```bash
# Check SSH status
sudo systemctl status ssh

# If not enabled:
sudo systemctl enable ssh
sudo systemctl start ssh
```

---

## Docker Installation

### Install Docker

```bash
# Install Docker using official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Activate group changes (or logout/login)
newgrp docker
```

### Configure Docker

```bash
# Enable Docker service
sudo systemctl enable docker

# Start Docker service
sudo systemctl start docker
```

### Verify Installation

```bash
# Check Docker version
docker --version

# Run test container
docker run hello-world
```

**Expected Output:**

```
Docker version 24.0.x, build xxxxx

Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

## SSH Configuration

> **FOR EXISTING INSTALLATIONS**: If you need to reset SSH credentials on an already-running Pi, jump to [Reset SSH Credentials](#reset-ssh-credentials-existing-installation) below.

### Enable SSH

SSH is required for remote access and deployment automation.

**Enable SSH via Raspberry Pi Configuration:**

```bash
sudo raspi-config
```

Navigate to: `Interface Options` > `SSH` > `Enable`

**Or enable manually:**

```bash
sudo systemctl enable ssh
sudo systemctl start ssh
```

### Generate SSH Keys

**On your local machine** (not on Pi), generate SSH keys:

```bash
# Generate Ed25519 key (modern, secure)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Save to: ~/.ssh/id_ed25519
# Passphrase: (recommended - use strong passphrase)
```

**Why Ed25519?**

- More secure than RSA
- Smaller key size
- Faster generation and verification
- Recommended by modern security standards

### Configure Authorized Keys

**Copy public key to Raspberry Pi:**

```bash
# Method 1: Using ssh-copy-id (easiest)
ssh-copy-id -i ~/.ssh/id_ed25519.pub pi@raspberrypi.local

# Method 2: Manual copy
cat ~/.ssh/id_ed25519.pub | ssh pi@raspberrypi.local "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Verify key-based login:**

```bash
ssh -i ~/.ssh/id_ed25519 pi@raspberrypi.local
```

### Secure SSH

**On Raspberry Pi**, edit SSH config:

```bash
sudo nano /etc/ssh/sshd_config
```

**Recommended settings:**

```conf
# Disable password authentication (use keys only)
PasswordAuthentication no

# Disable root login
PermitRootLogin no

# Limit login attempts
MaxAuthTries 3

# Disconnect idle sessions
ClientAliveInterval 300
ClientAliveCountMax 2
```

**Restart SSH:**

```bash
sudo systemctl restart sshd
```

---

### Reset SSH Credentials (Existing Installation)

If your Pi is already running and you need to reset SSH credentials, follow these steps:

#### Step 1: Access the Pi

First, get console access to your Pi using **one** of these methods:

**Option A: Physical access** (Recommended if available)

- Connect monitor via HDMI
- Connect keyboard via USB
- Login with current username/password

**Option B: Existing SSH access** (if you still have valid credentials)

```bash
ssh existing-user@your-pi-hostname-or-ip
```

**Option C: Enable password authentication temporarily** (if SSH keys are not working)

From physical console or if you can still access:

```bash
# On the Pi, temporarily enable password auth
sudo nano /etc/ssh/sshd_config

# Change this line to:
PasswordAuthentication yes

# Save and restart SSH
sudo systemctl restart sshd
```

#### Step 2: Reset User Password (Optional)

If you need to reset the user password:

```bash
# Change password for current user
passwd

# Or change password for specific user (requires sudo)
sudo passwd pi
```

#### Step 3: Generate New SSH Keys

**On your local machine**, generate new SSH keys:

```bash
# Generate new Ed25519 key
ssh-keygen -t ed25519 -C "sunny-stack-bot-deploy" -f ~/.ssh/sunny-stack-pi

# This creates:
# ~/.ssh/sunny-stack-pi (private key)
# ~/.ssh/sunny-stack-pi.pub (public key)
```

#### Step 4: Install New Public Key on Pi

**From your local machine**, copy the new public key:

```bash
# Display your new public key
cat ~/.ssh/sunny-stack-pi.pub

# Copy the output to clipboard
```

**On the Pi**, add the key to authorized_keys:

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Edit authorized_keys
nano ~/.ssh/authorized_keys

# Paste your public key (one line)
# Save with Ctrl+O, Enter, Ctrl+X

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

**Or do it all in one command from your local machine:**

```bash
# One-line copy (enter password when prompted)
cat ~/.ssh/sunny-stack-pi.pub | ssh pi@raspberrypi.local "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

#### Step 5: Test New SSH Key

**From your local machine**, test the new key:

```bash
# Test connection with new key
ssh -i ~/.ssh/sunny-stack-pi pi@raspberrypi.local

# If it works, you should be logged in without password
```

#### Step 6: Configure SSH for Convenience

**On your local machine**, add SSH config:

```bash
# Edit SSH config
nano ~/.ssh/config

# Add this entry:
Host sunny-pi
    HostName raspberrypi.local  # or use IP address
    User pi
    IdentityFile ~/.ssh/sunny-stack-pi
    IdentitiesOnly yes

# Save and exit

# Now you can connect simply with:
ssh sunny-pi
```

#### Step 7: Disable Password Authentication (Security)

**On the Pi**, re-secure SSH:

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Ensure these settings:
PasswordAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes

# Save and restart SSH
sudo systemctl restart sshd
```

#### Step 8: Set Up GitHub Secrets (For CI/CD)

For automated deployment, you'll need to configure GitHub Secrets:

```bash
# On the Pi, display the private key that GitHub Actions will use
# (This should be a deployment-specific key, not your personal key)
cat ~/.ssh/id_ed25519

# Copy the ENTIRE output from the BEGIN header to the END footer
```

Then add to GitHub repository:

1. Go to repository Settings > Secrets and variables > Actions
2. Add secret: `PI_SSH_KEY` = (paste private key)
3. Add secret: `PI_HOST` = raspberrypi.local (or IP address)
4. Add secret: `PI_USERNAME` = pi
5. Add secret: `PI_SSH_PORT` = 22

#### Troubleshooting SSH Reset

**Problem: "Permission denied (publickey)"**

```bash
# Check if SSH is running
sudo systemctl status ssh

# Check authorized_keys permissions
ls -la ~/.ssh/
# Should show: drwx------ (700) for .ssh
# Should show: -rw------- (600) for authorized_keys

# Check SSH logs for errors
sudo tail -f /var/log/auth.log
```

**Problem: "Connection refused"**

```bash
# Verify SSH is listening
sudo netstat -tlnp | grep :22

# Check firewall (if enabled)
sudo ufw status
sudo ufw allow 22/tcp
```

**Problem: "Host key verification failed"**

```bash
# Remove old host key
ssh-keygen -R raspberrypi.local
# Or remove specific IP
ssh-keygen -R 192.168.1.X

# Try connecting again
ssh sunny-pi
```

---

## Environment Configuration

### Create .env File

**On Raspberry Pi**, create environment file:

```bash
cd ~/sunny-stack-bot
nano .env
```

### Set Environment Variables

**Required Pi Variables (16):**

```bash
# Discord Bot (4)
DISCORD_BOT_TOKEN=your-bot-token-here
DISCORD_APPLICATION_ID=1234567890123456789
DISCORD_GUILD_ID=your-guild-id-here
DISCORD_ADMIN_USER_ID=your-user-id-here

# Discord Channels (13)
DISCORD_CHANNEL_ADMIN_LOGS=channel-id
DISCORD_CHANNEL_BOT_COMMANDS=channel-id
DISCORD_CHANNEL_ACTIVE_PROJECTS=channel-id
DISCORD_CHANNEL_PROPOSALS=channel-id
DISCORD_CHANNEL_TASKS=channel-id
DISCORD_CHANNEL_TIME_TRACKING=channel-id
DISCORD_CHANNEL_CLIENT_INQUIRIES=channel-id
DISCORD_CHANNEL_CLIENT_UPDATES=channel-id
DISCORD_CHANNEL_CALENDAR_SYNC=channel-id
DISCORD_CHANNEL_EMAIL_NOTIFICATIONS=channel-id
DISCORD_CHANNEL_ANALYTICS=channel-id
DISCORD_CHANNEL_INVOICES=channel-id
DISCORD_CHANNEL_PAYMENTS=channel-id

# Database (shared with Vercel)
DATABASE_URL=postgresql://user:pass@host/db
DATABASE_URL_UNPOOLED=postgresql://user:pass@host/db
POSTGRES_URL=postgresql://user:pass@host/db
POSTGRES_PRISMA_URL=postgresql://user:pass@host/db?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host/db

# Bot API (2)
BOT_API_KEY=your-shared-secret-here
BOT_API_URL=https://sunny-stack.com/api

# Deployment Mode
DEPLOYMENT_MODE=pi
```

For complete variable documentation, see: [.env.example](./.env.example)

### Validate Configuration

```bash
# Validate Pi environment variables
npm run validate:env:pi
```

**Expected Output (Success):**

```
============================================================
Environment Variable Validation
Mode: PI
============================================================

✅ All validations passed!
============================================================
```

---

## Network Configuration

### Static IP Setup

Assigning a static IP address ensures the Raspberry Pi is always accessible at the same address, critical for deployment automation and SSH access.

**Why Static IP?**

- Consistent SSH access (`ssh pi@192.168.1.100` always works)
- GitHub Actions deployment (no need to update IP)
- External monitoring tools (fixed endpoint)
- DNS configuration (if using custom domain)

**Method 1: Using dhcpcd (Recommended for Raspberry Pi OS)**

The `dhcpcd` service is the default network manager on Raspberry Pi OS.

**Step 1: Find your current network configuration**

```bash
# Check current IP and gateway
ip addr show eth0
# Look for: inet 192.168.1.X/24

# Check router/gateway
ip route | grep default
# Look for: default via 192.168.1.1

# Check DNS servers
cat /etc/resolv.conf
# Look for: nameserver 192.168.1.1
```

**Step 2: Edit dhcpcd configuration**

```bash
sudo nano /etc/dhcpcd.conf
```

**Step 3: Add static configuration at the end of the file**

```conf
# Static IP configuration for eth0 (Ethernet)
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8

# Optional: Static IP for WiFi
# interface wlan0
# static ip_address=192.168.1.101/24
# static routers=192.168.1.1
# static domain_name_servers=192.168.1.1 8.8.8.8
```

**Configuration Explanation:**

- `interface eth0`: Apply to Ethernet (use `wlan0` for WiFi)
- `static ip_address=192.168.1.100/24`: Your chosen static IP + subnet mask
- `static routers=192.168.1.1`: Your router/gateway address
- `static domain_name_servers`: DNS servers (router + Google DNS as backup)

**Step 4: Restart networking**

```bash
# Restart dhcpcd service
sudo systemctl restart dhcpcd

# Or reboot (safer)
sudo reboot
```

**Step 5: Verify static IP**

```bash
# Check IP address
ip addr show eth0

# Expected: inet 192.168.1.100/24

# Test connectivity
ping -c 4 8.8.8.8
ping -c 4 google.com
```

**Method 2: Using Netplan (Alternative for Ubuntu Server)**

If using Ubuntu Server instead of Raspberry Pi OS:

**Step 1: Create netplan configuration**

```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

**Step 2: Add configuration**

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 192.168.1.1
          - 8.8.8.8
```

**Step 3: Apply configuration**

```bash
sudo netplan apply
```

**Choosing Your Static IP:**

**Best Practices:**

1. **Check DHCP range**: Most routers assign 192.168.1.100-192.168.1.200
   - Choose IP outside DHCP range (e.g., 192.168.1.50)
   - Or configure router to reserve IP for Pi's MAC address

2. **Use low number**: 192.168.1.10-192.168.1.50 (easier to remember)

3. **Document it**: Write down IP, gateway, and DNS settings

**Check router DHCP settings:**

```
Router admin panel > DHCP Settings
- Start IP: 192.168.1.100
- End IP: 192.168.1.200
- Choose static IP: 192.168.1.50 (outside range)
```

**Troubleshooting:**

**Problem: No network after static IP**

```bash
# Check IP configuration
ip addr show eth0

# Check routing
ip route

# Check if gateway is reachable
ping 192.168.1.1
```

**Solution:** Verify router IP and subnet match your configuration.

**Problem: Can't resolve DNS**

```bash
# Test DNS resolution
nslookup google.com
```

**Solution:** Add Google DNS (8.8.8.8) to static_domain_name_servers.

**Problem: IP conflict**

```bash
# Check for IP conflicts
sudo arping -I eth0 192.168.1.100
```

**Solution:** Choose different IP or remove conflicting device.

### Firewall Rules

Configure UFW (Uncomplicated Firewall) to control network access to the Raspberry Pi, protecting against unauthorized access while allowing necessary services.

**Why Firewall?**

- Block unauthorized access attempts
- Limit attack surface
- Rate-limit SSH brute-force attempts
- Log suspicious activity

**Step 1: Install UFW**

```bash
# Install UFW
sudo apt update
sudo apt install -y ufw
```

**Step 2: Configure default policies**

```bash
# Deny all incoming by default
sudo ufw default deny incoming

# Allow all outgoing by default
sudo ufw default allow outgoing
```

**Step 3: Allow required ports**

```bash
# SSH (required for remote access)
sudo ufw allow 22/tcp comment 'SSH access'

# Alternative: Allow SSH from specific IP only (more secure)
sudo ufw allow from 192.168.1.0/24 to any port 22 comment 'SSH from local network only'

# Health check endpoint (optional for external monitoring)
sudo ufw allow 8080/tcp comment 'Bot health check'

# Discord bot (outgoing only, no incoming ports needed)
# Bot connects OUT to Discord, no incoming connections required
```

**Step 4: Enable rate limiting for SSH**

```bash
# Limit SSH connection attempts (protects against brute force)
sudo ufw limit 22/tcp comment 'Rate limit SSH'
```

**Rate Limiting:**

- Denies connections from IP that attempts 6+ connections within 30 seconds
- Protects against brute-force attacks
- Automatically expires after 30 seconds

**Step 5: Enable UFW**

```bash
# Enable firewall (will prompt for confirmation)
sudo ufw enable

# Check status
sudo ufw status verbose
```

**Expected Output:**

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     LIMIT       Anywhere                   # Rate limit SSH
8080/tcp                   ALLOW       Anywhere                   # Bot health check
22/tcp (v6)                LIMIT       Anywhere (v6)              # Rate limit SSH
8080/tcp (v6)              ALLOW       Anywhere (v6)              # Bot health check
```

**Step 6: Configure logging**

```bash
# Set logging level
sudo ufw logging medium

# View firewall logs
sudo tail -f /var/log/ufw.log
```

**Log Levels:**

- `off`: No logging
- `low`: Log blocked packets only
- `medium`: Log blocked packets + rate-limited connections
- `high`: Log all packets (verbose, use for debugging only)
- `full`: Full packet logging (very verbose)

**Common UFW Commands:**

```bash
# Check status
sudo ufw status numbered

# Delete rule by number
sudo ufw delete 3

# Disable firewall (temporarily)
sudo ufw disable

# Re-enable firewall
sudo ufw enable

# Reset all rules (start over)
sudo ufw reset

# Allow specific IP
sudo ufw allow from 203.0.113.100 to any port 22

# Block specific IP
sudo ufw deny from 203.0.113.100
```

**Recommended Rules for Production:**

```bash
# SSH from local network only (most secure)
sudo ufw allow from 192.168.1.0/24 to any port 22

# OR SSH from anywhere with rate limiting (if remote access needed)
sudo ufw limit 22/tcp

# Health check (if using external monitoring)
sudo ufw allow 8080/tcp

# HTTPS for webhooks (if implementing webhook receiver)
# sudo ufw allow 443/tcp

# Monitor blocked attempts
sudo ufw logging medium
```

**Security Considerations:**

- **Don't lock yourself out**: Test SSH access before rebooting
- **Allow SSH first**: Always allow SSH before enabling UFW
- **Use rate limiting**: Protects against brute-force attacks
- **Monitor logs**: Check /var/log/ufw.log for blocked attempts

### Port Forwarding

Port forwarding exposes the Raspberry Pi to the internet, allowing external access to services. **Only configure if absolutely necessary**.

**Warning:** Exposing services to the internet increases security risk. Only forward ports if:

- You need external health check monitoring
- You need remote SSH access from outside your network
- You have configured proper security (SSH keys, firewall, fail2ban)

**Step 1: Find your router's admin panel**

```bash
# Check router IP (usually your gateway)
ip route | grep default
# Output: default via 192.168.1.1 dev eth0

# Access router admin panel
# Open browser: http://192.168.1.1
# Login with router credentials
```

**Step 2: Port forwarding configuration**

Navigate to: **Advanced Settings > Port Forwarding** (location varies by router)

**SSH Access (Port 22):**

| Setting       | Value           | Example                     |
| ------------- | --------------- | --------------------------- |
| Service Name  | SSH-RaspberryPi | SSH-RaspberryPi             |
| External Port | 2222            | 2222 (NOT 22, for security) |
| Internal IP   | Pi static IP    | 192.168.1.100               |
| Internal Port | 22              | 22                          |
| Protocol      | TCP             | TCP                         |

**Health Check (Port 8080):**

| Setting       | Value        | Example       |
| ------------- | ------------ | ------------- |
| Service Name  | Bot-Health   | Bot-Health    |
| External Port | 8080         | 8080          |
| Internal IP   | Pi static IP | 192.168.1.100 |
| Internal Port | 8080         | 8080          |
| Protocol      | TCP          | TCP           |

**Step 3: Test external access**

```bash
# Find your public IP
curl ifconfig.me

# Test SSH from external network (using phone hotspot or different network)
ssh pi@YOUR_PUBLIC_IP -p 2222

# Test health check
curl http://YOUR_PUBLIC_IP:8080/health
```

**Security Best Practices for Exposed Ports:**

**1. Change default SSH port**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change port
Port 2222

# Restart SSH
sudo systemctl restart sshd

# Update UFW
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

**2. Use non-standard external ports**

- External SSH: 2222 (instead of 22)
- External Health: 8080 (or use HTTPS with reverse proxy)

**3. IP whitelisting (if possible)**

Only allow access from known IPs:

```bash
# Allow SSH from specific external IP only
sudo ufw allow from YOUR_OFFICE_IP to any port 22
```

**4. Set up dynamic DNS (if you don't have static public IP)**

Most home internet has dynamic IP that changes periodically.

**Option 1: No-IP (Free)**

1. Sign up: https://www.noip.com
2. Create hostname: `mybot.ddns.net`
3. Install DUC (Dynamic Update Client) on Pi:

```bash
cd /usr/local/src
sudo wget http://www.noip.com/client/linux/noip-duc-linux.tar.gz
sudo tar xzf noip-duc-linux.tar.gz
cd noip-2.1.9-1
sudo make
sudo make install
sudo /usr/local/bin/noip2
```

4. Configure with your No-IP credentials
5. Access Pi via: `ssh pi@mybot.ddns.net -p 2222`

**Option 2: DuckDNS (Free)**

1. Sign up: https://www.duckdns.org
2. Get token and domain: `mybot.duckdns.org`
3. Install update script:

```bash
mkdir ~/duckdns
cd ~/duckdns
nano duck.sh
```

4. Add update script:

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mybot&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

5. Make executable and schedule:

```bash
chmod +x duck.sh
crontab -e
# Add: */5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

**Recommended Configuration (Minimal Exposure):**

```
Ports Exposed: NONE (default)

SSH Access:
- Method: VPN (Tailscale or WireGuard)
- Or: SSH only from local network
- Never: Direct SSH exposure to internet

Health Check:
- Method: UptimeRobot checking local IP via VPN
- Or: No external monitoring
- Never: Port 8080 exposed without authentication
```

**VPN Alternative (Most Secure):**

Instead of port forwarding, use VPN for remote access:

**Tailscale (Easiest):**

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate
sudo tailscale up

# Access Pi from anywhere via Tailscale IP
ssh pi@100.x.y.z
```

**Benefits:**

- No port forwarding needed
- Encrypted connections
- No exposure to internet
- Works behind NAT

---

## Security Hardening

Harden the Raspberry Pi against common security threats, reducing the attack surface and protecting against unauthorized access.

### System Updates

Keep the system up-to-date with automatic security updates to protect against known vulnerabilities.

**Manual Updates:**

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Dist upgrade (major version upgrades)
sudo apt dist-upgrade -y

# Remove unnecessary packages
sudo apt autoremove -y

# Clean package cache
sudo apt clean
```

**Enable Automatic Security Updates:**

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades apt-listchanges

# Enable automatic updates
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Select "Yes" when prompted
```

**Configure Automatic Updates:**

```bash
# Edit configuration
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

**Recommended configuration:**

```conf
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}:${distro_codename}-updates";
};

// Automatically reboot if required
Unattended-Upgrade::Automatic-Reboot "true";

// Reboot time (3am)
Unattended-Upgrade::Automatic-Reboot-Time "03:00";

// Email notifications (optional)
//Unattended-Upgrade::Mail "your-email@example.com";

// Remove unused dependencies
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

**Enable automatic update check:**

```bash
# Edit auto-update configuration
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

```conf
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
```

**Test automatic updates:**

```bash
# Dry run (test without applying)
sudo unattended-upgrades --dry-run --debug

# Check logs
sudo cat /var/log/unattended-upgrades/unattended-upgrades.log
```

**Update Schedule:**

```bash
# Automatic updates run daily via cron
# Check: /etc/cron.daily/apt-compat

# Manual verification
sudo systemctl status unattended-upgrades
```

**Monitor Update Status:**

```bash
# Check last update
stat /var/lib/apt/periodic/update-success-stamp

# Check pending updates
apt list --upgradable

# View update history
cat /var/log/apt/history.log
```

**Reboot Management:**

```bash
# Check if reboot required
test -f /var/run/reboot-required && echo "Reboot required"

# Check which packages require reboot
cat /var/run/reboot-required.pkgs

# Schedule reboot
sudo shutdown -r +5 "System reboot for updates in 5 minutes"
```

### User Management

Secure user accounts by disabling default users, creating secure accounts, and managing permissions.

**Disable Default 'pi' User (Recommended for Production):**

**Step 1: Create new user with sudo privileges**

```bash
# Create new user
sudo adduser botadmin

# Add to sudo group
sudo usermod -aG sudo botadmin

# Add to docker group (if using Docker)
sudo usermod -aG docker botadmin

# Verify groups
groups botadmin
# Should show: botadmin sudo docker
```

**Step 2: Test new user**

```bash
# Switch to new user
su - botadmin

# Test sudo
sudo whoami
# Should output: root

# Exit
exit
```

**Step 3: Transfer SSH keys**

```bash
# Copy SSH keys to new user
sudo cp -r /home/pi/.ssh /home/botadmin/
sudo chown -R botadmin:botadmin /home/botadmin/.ssh
sudo chmod 700 /home/botadmin/.ssh
sudo chmod 600 /home/botadmin/.ssh/authorized_keys
```

**Step 4: Test SSH with new user**

```bash
# From development machine
ssh botadmin@raspberrypi.local

# Verify sudo works
sudo ls /root
```

**Step 5: Disable pi user (after confirming new user works)**

```bash
# Lock pi user (can be unlocked if needed)
sudo usermod -L pi

# Or delete pi user entirely (irreversible)
sudo deluser --remove-home pi
```

**User Permission Auditing:**

```bash
# List all users
cut -d: -f1 /etc/passwd

# List sudo users
getent group sudo

# Check user login history
last

# Check failed login attempts
sudo lastb
```

**Password Policy (Optional but Recommended):**

```bash
# Install password quality tools
sudo apt install -y libpam-pwquality

# Edit PAM configuration
sudo nano /etc/pam.d/common-password
```

**Add password requirements:**

```conf
password requisite pam_pwquality.so retry=3 minlen=12 difok=3
```

**Requirements:**

- Minimum 12 characters
- At least 3 different characters from old password
- 3 retry attempts

### SSH Security

Harden SSH configuration to prevent unauthorized access.

**SSH Hardening Checklist:**

**1. Disable Password Authentication (Use Keys Only)**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

**Security Settings:**

```conf
# Authentication
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
ChallengeResponseAuthentication no

# Limit login attempts
MaxAuthTries 3
MaxSessions 2

# Disconnect idle sessions
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable empty passwords
PermitEmptyPasswords no

# Disable X11 forwarding (not needed for server)
X11Forwarding no

# Use protocol 2 only
Protocol 2

# Limit users who can SSH (optional)
AllowUsers botadmin

# Limit SSH to specific IPs (optional)
# ListenAddress 192.168.1.100

# Change default port (security through obscurity)
# Port 2222
```

**Restart SSH:**

```bash
sudo systemctl restart sshd
```

**2. SSH Key Requirements**

```bash
# On client machine, generate strong key (if not already done)
ssh-keygen -t ed25519 -a 100 -C "botadmin@raspberrypi"

# Copy to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub botadmin@raspberrypi.local
```

**3. Configure SSH Client (Development Machine)**

Create SSH config for easier access:

```bash
# Edit ~/.ssh/config
nano ~/.ssh/config
```

**Add configuration:**

```conf
Host raspi
    HostName raspberrypi.local
    User botadmin
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Now connect easily:**

```bash
ssh raspi
```

**4. Two-Factor Authentication (Advanced)**

```bash
# Install Google Authenticator
sudo apt install -y libpam-google-authenticator

# Configure for user
google-authenticator

# Follow prompts:
# - Time-based tokens: Yes
# - Update .google_authenticator: Yes
# - Disallow reuse: Yes
# - Rate limiting: Yes

# Edit PAM SSH config
sudo nano /etc/pam.d/sshd
```

**Add at top:**

```conf
auth required pam_google_authenticator.so
```

**Edit sshd_config:**

```bash
sudo nano /etc/ssh/sshd_config
```

**Enable challenge-response:**

```conf
ChallengeResponseAuthentication yes
```

**Restart SSH:**

```bash
sudo systemctl restart sshd
```

**Now SSH requires both key AND 2FA code.**

### Fail2Ban

Fail2Ban monitors logs and automatically bans IPs that show malicious behavior (brute-force attempts).

**Step 1: Install Fail2Ban**

```bash
sudo apt install -y fail2ban
```

**Step 2: Configure Fail2Ban**

```bash
# Copy default config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit local config
sudo nano /etc/fail2ban/jail.local
```

**Step 3: Configure SSH jail**

Find the `[sshd]` section and configure:

```conf
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

**Settings Explained:**

- `enabled`: Enable SSH jail
- `port`: SSH port (change if using non-standard port)
- `maxretry`: Ban after 3 failed attempts
- `bantime`: Ban for 3600 seconds (1 hour)
- `findtime`: 3 failures within 600 seconds (10 minutes)

**Step 4: Start and Enable Fail2Ban**

```bash
# Start service
sudo systemctl start fail2ban

# Enable on boot
sudo systemctl enable fail2ban

# Check status
sudo systemctl status fail2ban
```

**Step 5: Monitor Fail2Ban**

```bash
# Check banned IPs
sudo fail2ban-client status sshd

# Unban IP
sudo fail2ban-client set sshd unbanip 203.0.113.100

# View logs
sudo tail -f /var/log/fail2ban.log
```

**Advanced Fail2Ban Configuration:**

**Email Notifications:**

```conf
# In /etc/fail2ban/jail.local

[DEFAULT]
destemail = your-email@example.com
sendername = Fail2Ban
action = %(action_mwl)s
```

**Permanent Ban (After Multiple Offenses):**

```bash
# Create recidive jail
sudo nano /etc/fail2ban/jail.local
```

**Add:**

```conf
[recidive]
enabled = true
filter = recidive
logpath = /var/log/fail2ban.log
bantime = -1
findtime = 86400
maxretry = 3
```

**This permanently bans IPs that get banned 3+ times in 24 hours.**

**Monitor Banned IPs:**

```bash
# Check all jails
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd

# Expected output:
Status for the jail: sshd
|- Filter
|  |- Currently failed: 0
|  |- Total failed:     12
|  `- File list:        /var/log/auth.log
`- Actions
   |- Currently banned: 2
   |- Total banned:     5
   `- Banned IP list:   203.0.113.100 198.51.100.50
```

**Troubleshooting Fail2Ban:**

```bash
# Test regex pattern
sudo fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf

# Reload config
sudo fail2ban-client reload

# Check why jail isn't starting
sudo fail2ban-client -vvv status sshd
```

---

## Deployment Preparation

### Clone Repository

```bash
cd /home/pi
git clone https://github.com/yourusername/sunny-stack.git
cd sunny-stack
```

### Install Dependencies

```bash
npm install
```

### Build Application

```bash
# Build Discord bot
npm run build:bot

# Verify build output
ls -la bot/dist/
```

---

## References

- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Raspberry Pi Official Documentation](https://www.raspberrypi.com/documentation/)
- [Docker on Raspberry Pi](https://docs.docker.com/engine/install/debian/)

---

**Documentation Status:** 🚧 In Progress
**Phase:** 5.0 Pre-Implementation
**Next Steps:** Complete sections marked with _(Content to be added)_
