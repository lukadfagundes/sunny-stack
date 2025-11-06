#!/bin/bash
# =============================================================================
# Documentation Personalization Script
# =============================================================================
# This script replaces generic placeholders with your actual deployment values.
#
# Usage:
#   1. Edit the "YOUR VALUES" section below
#   2. chmod +x scripts/personalize-docs.sh
#   3. ./scripts/personalize-docs.sh
#
# This will update all markdown files with your specific values.
# =============================================================================

set -e

# =============================================================================
# YOUR VALUES - Edit these with your actual deployment information
# =============================================================================

# Get Pi IP: ssh into Pi and run: hostname -I
PI_IP="192.168.1.42"  # CHANGE THIS

# Get Pi hostname: ssh into Pi and run: hostname
PI_HOSTNAME="raspberrypi"  # CHANGE THIS

# Your database configuration
DB_USER="mydbuser"  # CHANGE THIS
DB_NAME="mydb"      # CHANGE THIS

# Your Vercel deployment URL
VERCEL_URL="https://my-portfolio.vercel.app"  # CHANGE THIS

# Your GitHub repository (format: username/repo)
GITHUB_REPO="john-doe/my-discord-bot"  # CHANGE THIS

# Your project name (used for container names)
PROJECT_NAME="my-project"  # CHANGE THIS

# =============================================================================
# End of configuration - Do not edit below this line
# =============================================================================

echo "================================================"
echo "Personalizing Documentation Files"
echo "================================================"
echo ""
echo "Configuration:"
echo "  Pi IP: $PI_IP"
echo "  Pi Hostname: $PI_HOSTNAME"
echo "  Database User: $DB_USER"
echo "  Database Name: $DB_NAME"
echo "  Vercel URL: $VERCEL_URL"
echo "  GitHub Repo: $GITHUB_REPO"
echo "  Project Name: $PROJECT_NAME"
echo ""
read -p "Continue with these values? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 1
fi

# Files to personalize
FILES=(
  "DEPLOYMENT-CHECKLIST.md"
  "DEPLOYMENT-OVERVIEW.md"
  "GITHUB-ACTIONS-SETUP.md"
  "PI-PRODUCTION-DEPLOYMENT.md"
  "PI-TESTING-GUIDE.md"
  "RASPBERRY-PI-SETUP.md"
  "README.md"
  "TROUBLESHOOTING.md"
)

# Create backups
echo ""
echo "Creating backups..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$file.backup"
    echo "  ✓ Backed up: $file"
  fi
done

echo ""
echo "Replacing placeholders with your values..."

# Replace placeholders in each file
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ⚠ Skipped: $file (not found)"
    continue
  fi

  echo "  Processing: $file"

  # IP address
  sed -i "s/YOUR_PI_IP/$PI_IP/g" "$file"

  # Hostname
  sed -i "s/your-pi\.local/$PI_HOSTNAME.local/g" "$file"
  sed -i "s/your-pi/$PI_HOSTNAME/g" "$file"

  # URLs
  sed -i "s|https://your-site\.vercel\.app|$VERCEL_URL|g" "$file"
  sed -i "s/your-site\.vercel\.app/${VERCEL_URL#https://}/g" "$file"

  # Database user
  sed -i "s/YOUR_DB_USER/$DB_USER/g" "$file"

  # Database name
  sed -i "s/YOUR_DB_NAME/$DB_NAME/g" "$file"

  # GitHub repo
  sed -i "s/YOUR_USERNAME\/YOUR_REPO/$GITHUB_REPO/g" "$file"
  sed -i "s/github\.com\/YOUR_USERNAME/github.com\/${GITHUB_REPO%/*}/g" "$file"

  # Container names
  sed -i "s/your-project-db/${PROJECT_NAME}-db/g" "$file"
  sed -i "s/your-project-bot/${PROJECT_NAME}-bot/g" "$file"
  sed -i "s/your-project-api/${PROJECT_NAME}-api/g" "$file"

  # Service names
  sed -i "s/your-project\.service/${PROJECT_NAME}.service/g" "$file"

  echo "  ✓ Updated: $file"
done

echo ""
echo "================================================"
echo "✅ Personalization Complete"
echo "================================================"
echo ""
echo "Backups created with .backup extension"
echo ""
echo "Files updated:"
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  • $file"
  fi
done
echo ""
echo "⚠️  IMPORTANT: Do NOT commit these personalized files to Git!"
echo "   These files contain your specific deployment information."
echo ""
echo "To restore generic placeholders:"
echo "  ./scripts/sanitize-docs.sh"
echo ""
echo "To restore backups:"
echo "  for f in *.backup; do mv \"\$f\" \"\${f%.backup}\"; done"
echo ""
echo "================================================"
