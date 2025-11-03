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
  - [Flash SD Card](#flash-sd-card)
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

### Download Raspberry Pi OS

_(Content to be added)_

### Flash SD Card

_(Content to be added)_

### Initial Boot

_(Content to be added)_

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

_(Content to be added)_

### Enable Services

_(Content to be added)_

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

## Environment Configuration

### Create .env File

**On Raspberry Pi**, create environment file:

```bash
cd /home/pi/sunny-stack
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

_(Content to be added)_

### Firewall Rules

_(Content to be added)_

### Port Forwarding

_(Content to be added)_

---

## Security Hardening

### System Updates

_(Content to be added)_

### User Management

_(Content to be added)_

### SSH Security

_(Content to be added)_

### Fail2Ban

_(Content to be added)_

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
