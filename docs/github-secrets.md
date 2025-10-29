# GitHub Secrets Configuration

**Purpose:** Configure GitHub repository secrets for CI/CD pipeline
**Required For:** Automated bot deployment to Raspberry Pi
**Estimated Time:** 30-45 minutes
**When Needed:** Phase 4 (Deployment) - **Not needed for Phase 0-3 development**

**⚠️ Note:** You can skip this guide until Phase 4 (Deployment). During Phase 0-3, you'll be developing and testing locally. The Raspberry Pi setup and CI/CD pipeline are only needed when you're ready to deploy the bot to run 24/7.

---

## Required Secrets

The following secrets must be configured in your GitHub repository for the CI/CD pipeline to work.

**Location:** Repository → Settings → Secrets and variables → Actions → New repository secret

---

## Raspberry Pi SSH Access

### PI_HOST

**Description:** IP address or hostname of your Raspberry Pi
**Example:** `192.168.1.100` or `pi.local`
**How to get:**

```bash
# On Raspberry Pi, run:
hostname -I
```

---

### PI_USERNAME

**Description:** SSH username for Raspberry Pi
**Default:** `pi`
**Example:** `pi` or your custom username

---

### PI_SSH_KEY

**Description:** Private SSH key for passwordless authentication
**How to generate:**

```bash
# On your local machine, generate SSH key pair:
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_pi

# Copy public key to Raspberry Pi:
ssh-copy-id -i ~/.ssh/github_actions_pi.pub pi@YOUR_PI_IP

# Copy private key content (this goes in GitHub Secret):
cat ~/.ssh/github_actions_pi
```

**Secret value:** Entire private key including headers

```text
Example format (your actual key will be much longer):

[Header line will say: BEGIN OPENSSH PRIVATE KEY]
[base64 encoded key data - many lines of random characters]
[Footer line will say: END OPENSSH PRIVATE KEY]

Copy the ENTIRE output from: cat ~/.ssh/github_actions_pi
Paste it directly into GitHub Secrets (no quotes, no modifications)
The key should include the BEGIN/END header lines.
```

---

### PI_SSH_PORT (Optional)

**Description:** SSH port on Raspberry Pi
**Default:** `22`
**Example:** `2222` (if you changed the default SSH port)
**Leave blank if using default port 22**

---

## Discord Webhook

### DISCORD_WEBHOOK_URL

**Description:** Discord webhook URL for deployment notifications
**How to create:**

1. Open Discord
2. Go to your server settings
3. Navigate to: **Integrations** → **Webhooks**
4. Click **New Webhook**
5. Configure webhook:
   - **Name:** GitHub Deployments
   - **Channel:** #monitoring or #deployments
   - **Avatar:** (optional)
6. Click **Copy Webhook URL**
7. Save URL as GitHub secret

**Example format:**

```
https://discord.com/api/webhooks/1234567890/AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

## Summary Checklist

Before deploying, ensure all secrets are configured:

- [ ] **PI_HOST** - Raspberry Pi IP address
- [ ] **PI_USERNAME** - SSH username (usually `pi`)
- [ ] **PI_SSH_KEY** - Private SSH key for authentication
- [ ] **PI_SSH_PORT** - SSH port (optional, default 22)
- [ ] **DISCORD_WEBHOOK_URL** - Discord webhook for notifications

---

## Raspberry Pi Setup

Before the CI/CD pipeline can deploy, your Raspberry Pi must be prepared:

### 1. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# Log out and back in for group changes
```

### 2. Install Docker Compose

```bash
# Install Docker Compose
sudo apt install -y docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. Create Bot Directory

```bash
# Create directory for bot
mkdir -p ~/sunny-stack-bot
cd ~/sunny-stack-bot

# Create docker-compose.yml (will be updated by CI/CD)
cat > docker-compose.yml <<EOF
version: '3.8'

services:
  bot:
    image: ghcr.io/lukadfagundes/sunny-stack/discord-bot:latest
    container_name: sunny-stack-bot
    restart: unless-stopped
    env_file:
      - .env
    networks:
      - bot-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  bot-network:
    driver: bridge
EOF
```

### 4. Create Environment File

```bash
# Create .env file with secrets
nano .env
```

Copy all environment variables from your `.env.local` file (see `.env.example` for reference).

**Important:** This `.env` file on Pi contains production secrets. Keep it secure!

### 5. Configure SSH

```bash
# Ensure SSH is enabled
sudo systemctl enable ssh
sudo systemctl start ssh

# (Optional) Change default SSH port for security
sudo nano /etc/ssh/sshd_config
# Change: Port 22 → Port 2222
sudo systemctl restart ssh
```

### 6. Configure Firewall (Optional but Recommended)

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (use your custom port if changed)
sudo ufw allow 22/tcp
# or: sudo ufw allow 2222/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 7. Test SSH Connection

From your local machine:

```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions_pi pi@YOUR_PI_IP

# If using custom port:
ssh -i ~/.ssh/github_actions_pi -p 2222 pi@YOUR_PI_IP
```

### 8. Test Docker Login

```bash
# On Raspberry Pi, test GitHub Container Registry login
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Should see: "Login Succeeded"
```

---

## Verifying CI/CD Pipeline

### Manual Trigger Test

1. Go to GitHub repository → **Actions**
2. Select **Deploy Discord Bot to Raspberry Pi** workflow
3. Click **Run workflow** dropdown
4. Click **Run workflow** button
5. Watch the workflow execute

### Expected Steps

1. ✅ **Build**: Docker image builds successfully
2. ✅ **Deploy**: Image deployed to Raspberry Pi
3. ✅ **Notify**: Discord notification sent

### Troubleshooting

**Error: "Permission denied (publickey)"**

- SSH key not added to Pi or incorrect format
- Solution: Re-run `ssh-copy-id` and verify PI_SSH_KEY secret

**Error: "Could not resolve hostname"**

- PI_HOST incorrect or Pi not reachable
- Solution: Verify Pi IP address with `hostname -I` on Pi

**Error: "docker: command not found"**

- Docker not installed on Pi
- Solution: Follow Docker installation steps above

**Error: "permission denied while trying to connect to Docker daemon"**

- User not in docker group
- Solution: Run `sudo usermod -aG docker $USER` and log out/in

**Error: "Failed to pull image"**

- GitHub Container Registry authentication failed
- Solution: Verify GITHUB_TOKEN has packages:read permission

---

## Security Best Practices

1. **Never commit secrets** to git repository
2. **Use SSH keys** instead of passwords
3. **Restrict SSH access** to specific IPs if possible
4. **Rotate secrets** regularly (quarterly)
5. **Monitor deployment logs** for suspicious activity
6. **Use strong passwords** for Pi user account
7. **Keep Pi software updated** with `sudo apt update && sudo apt upgrade`

---

## Deployment Workflow

### Automatic Deployment (Main Branch)

When you push to `main` branch with changes in `bot/`, `lib/`, or `Dockerfile`:

1. GitHub Actions automatically triggers
2. Docker image builds for ARM64 architecture
3. Image pushed to GitHub Container Registry
4. SSH connection established to Raspberry Pi
5. Latest image pulled on Pi
6. Old container stopped, new container started
7. Discord notification sent with status

### Manual Deployment

Click **Run workflow** in GitHub Actions to deploy current version.

### Rollback

If deployment fails or introduces bugs:

1. Go to **Actions** → **Deploy Discord Bot**
2. Click **Run workflow**
3. Workflow will rollback to previous Docker image

---

## Monitoring Deployments

### View Logs

```bash
# On Raspberry Pi
cd ~/sunny-stack-bot

# View bot logs
docker-compose logs -f bot

# View last 100 lines
docker-compose logs --tail=100 bot
```

### Check Bot Status

```bash
# Check if container is running
docker-compose ps

# Check resource usage
docker stats sunny-stack-bot
```

### Restart Bot

```bash
# Restart bot container
docker-compose restart bot

# Full stop and start
docker-compose down && docker-compose up -d
```

---

## Next Steps

1. ✅ Configure all GitHub secrets
2. ✅ Set up Raspberry Pi with Docker
3. ✅ Create .env file on Pi with production secrets
4. ✅ Test SSH connection from local machine
5. ✅ Run first manual deployment
6. ⏳ Monitor bot in Discord (should come online)
7. ⏳ Verify automatic deployments on next push

---

**Setup Status:** CI/CD pipeline configuration complete
**Next Phase:** Phase 1 - Foundation & Database
**Estimated Setup Time:** 30-45 minutes
