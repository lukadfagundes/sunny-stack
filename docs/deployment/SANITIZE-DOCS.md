# Documentation Sanitization Guide

This guide explains how to replace specific deployment values with your own.

---

## Values to Replace

### Network Configuration

| In Documentation | Replace With     | How to Find                  |
| ---------------- | ---------------- | ---------------------------- |
| `192.168.1.19`   | Your Pi's IP     | Run `hostname -I` on your Pi |
| `YOUR_PI_IP`     | Your Pi's IP     | Run `hostname -I` on your Pi |
| `sunny-pi`       | Your Pi hostname | Run `hostname` on your Pi    |
| `your-pi`        | Your Pi hostname | Run `hostname` on your Pi    |

---

### Database Configuration

| In Documentation             | Replace With       | How to Find         |
| ---------------------------- | ------------------ | ------------------- |
| `sunnystack` (database user) | Your DB username   | Choose during setup |
| `YOUR_DB_USER`               | Your DB username   | Choose during setup |
| `YOUR_DB_NAME`               | Your database name | Choose during setup |
| `sunnystack` (database name) | Your database name | Choose during setup |

---

### URLs and Domains

| In Documentation               | Replace With    | How to Find            |
| ------------------------------ | --------------- | ---------------------- |
| `https://sunny-stack.com`      | Your Vercel URL | Check Vercel dashboard |
| `https://your-site.vercel.app` | Your Vercel URL | Check Vercel dashboard |

---

### GitHub Configuration

| In Documentation            | Replace With              | How to Find                   |
| --------------------------- | ------------------------- | ----------------------------- |
| `lukadfagundes/sunny-stack` | `YOUR_USERNAME/YOUR_REPO` | Your GitHub repo path         |
| `YOUR_USERNAME/YOUR_REPO`   | Your actual repo          | Format: `username/repository` |

---

### Container Names

| In Documentation   | Replace With            | How to Find                      |
| ------------------ | ----------------------- | -------------------------------- |
| `sunny-stack-db`   | Your DB container name  | Set in `docker-compose.prod.yml` |
| `sunny-stack-bot`  | Your bot container name | Set in `docker-compose.prod.yml` |
| `your-project-db`  | Your DB container name  | Choose a name                    |
| `your-project-bot` | Your bot container name | Choose a name                    |

---

## Quick Find & Replace Guide

### Step 1: Find Your Values

**On your Raspberry Pi:**

```bash
# Get Pi IP address
hostname -I
# Example output: 192.168.1.42

# Get Pi hostname
hostname
# Example output: raspberrypi
```

**In your Vercel dashboard:**

- Your production URL (e.g., `https://my-portfolio.vercel.app`)

**In your GitHub:**

- Your repository path (e.g., `john-doe/my-discord-bot`)

---

### Step 2: Replace in Documentation

Use find & replace in your editor for these files:

- `DEPLOYMENT-CHECKLIST.md`
- `DEPLOYMENT-OVERVIEW.md`
- `GITHUB-ACTIONS-SETUP.md`
- `PI-PRODUCTION-DEPLOYMENT.md`
- `PI-TESTING-GUIDE.md`
- `RASPBERRY-PI-SETUP.md`

**Common replacements:**

```bash
# IP Address
Find: YOUR_PI_IP
Replace: 192.168.1.42  # (your actual IP)

# Hostname
Find: your-pi
Replace: raspberrypi  # (your actual hostname)

# Database
Find: YOUR_DB_USER
Replace: mydbuser  # (your chosen username)

Find: YOUR_DB_NAME
Replace: mydb  # (your chosen database name)

# Vercel URL
Find: https://your-site.vercel.app
Replace: https://my-portfolio.vercel.app  # (your actual URL)

# GitHub
Find: YOUR_USERNAME/YOUR_REPO
Replace: john-doe/my-discord-bot  # (your actual repo)
```

---

## Automated Replacement (Optional)

Create a script to replace all values at once:

```bash
#!/bin/bash
# replace-values.sh

# Your actual values
PI_IP="192.168.1.42"
PI_HOSTNAME="raspberrypi"
DB_USER="mydbuser"
DB_NAME="mydb"
VERCEL_URL="https://my-portfolio.vercel.app"
GITHUB_REPO="john-doe/my-discord-bot"

# Files to update
FILES="DEPLOYMENT-CHECKLIST.md DEPLOYMENT-OVERVIEW.md GITHUB-ACTIONS-SETUP.md PI-PRODUCTION-DEPLOYMENT.md PI-TESTING-GUIDE.md RASPBERRY-PI-SETUP.md"

for file in $FILES; do
  echo "Updating $file..."
  sed -i.bak \
    -e "s/YOUR_PI_IP/$PI_IP/g" \
    -e "s/your-pi/$PI_HOSTNAME/g" \
    -e "s/YOUR_DB_USER/$DB_USER/g" \
    -e "s/YOUR_DB_NAME/$DB_NAME/g" \
    -e "s|https://your-site\.vercel\.app|$VERCEL_URL|g" \
    -e "s/YOUR_USERNAME\/YOUR_REPO/$GITHUB_REPO/g" \
    "$file"
done

echo "Done! Backup files saved as *.bak"
```

---

## Important Notes

### Keep Generic in Git

If you're sharing this project publicly, **keep the generic placeholders** in your Git repository:

- `YOUR_PI_IP`
- `YOUR_DB_USER`
- `your-site.vercel.app`
- `YOUR_USERNAME/YOUR_REPO`

Only replace them in your **local copies** for personal deployment.

---

### Use Environment Variables

Instead of hardcoding values in documentation, use environment variables:

```bash
# .env.production (NOT in Git)
PI_HOST=192.168.1.42
DB_USER=mydbuser
DB_NAME=mydb
VERCEL_URL=https://my-portfolio.vercel.app
```

Then reference them in scripts:

```bash
ssh $PI_HOST
psql postgresql://$DB_USER:$PASSWORD@$PI_HOST:5432/$DB_NAME
```

---

## Security Reminder

**Never commit these to Git:**

- Actual IP addresses (if concerned about privacy)
- Real database credentials
- API tokens
- SSH private keys
- Production URLs (if you want privacy)

**Safe to commit:**

- Generic placeholders (`YOUR_*`)
- Example values clearly marked as examples
- Architecture diagrams
- Port numbers
- Service names

---

**Last Updated:** 2025-11-06
**Purpose:** Guide for personalizing deployment documentation
