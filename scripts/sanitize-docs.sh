#!/bin/bash
# =============================================================================
# Documentation Sanitization Script
# =============================================================================
# This script replaces specific deployment values with generic placeholders
# to make the documentation safe for public repositories.
#
# Usage:
#   chmod +x scripts/sanitize-docs.sh
#   ./scripts/sanitize-docs.sh
#
# This will update all markdown files with generic placeholders.
# =============================================================================

set -e

echo "================================================"
echo "Sanitizing Documentation Files"
echo "================================================"

# Files to sanitize
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
echo "Creating backups..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$file.backup"
    echo "  ✓ Backed up: $file"
  fi
done

echo ""
echo "Replacing specific values with placeholders..."

# Replace values in each file
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ⚠ Skipped: $file (not found)"
    continue
  fi

  echo "  Processing: $file"

  # IP addresses
  sed -i 's/192\.168\.1\.19/YOUR_PI_IP/g' "$file"
  sed -i 's/192\.168\.1\.[0-9]\{1,3\}/YOUR_PI_IP/g' "$file"

  # Hostnames
  sed -i 's/sunny-pi\.local/your-pi.local/g' "$file"
  sed -i 's/sunny-pi/your-pi/g' "$file"

  # URLs
  sed -i 's|https://sunny-stack\.com|https://your-site.vercel.app|g' "$file"
  sed -i 's/sunny-stack\.com/your-site.vercel.app/g' "$file"

  # Database user (in connection strings)
  sed -i 's/postgresql:\/\/sunnystack:/postgresql:\/\/YOUR_DB_USER:/g' "$file"
  sed -i 's/@sunnystack/@ YOUR_DB_USER/g' "$file"
  sed -i 's/-U sunnystack/-U YOUR_DB_USER/g' "$file"
  sed -i 's/User: sunnystack/User: YOUR_DB_USER/g' "$file"

  # Database name (in connection strings and paths)
  sed -i 's/:5432\/sunnystack/:5432\/YOUR_DB_NAME/g' "$file"
  sed -i 's/Database: sunnystack/Database: YOUR_DB_NAME/g' "$file"
  sed -i 's/-d sunnystack/-d YOUR_DB_NAME/g' "$file"

  # GitHub repo
  sed -i 's/lukadfagundes\/sunny-stack/YOUR_USERNAME\/YOUR_REPO/g' "$file"
  sed -i 's/github\.com\/lukadfagundes/github.com\/YOUR_USERNAME/g' "$file"

  # Container names (be careful not to replace project name in paths)
  sed -i 's/sunny-stack-db/your-project-db/g' "$file"
  sed -i 's/sunny-stack-bot/your-project-bot/g' "$file"
  sed -i 's/sunny-stack-api/your-project-api/g' "$file"

  # Service names in systemd
  sed -i 's/sunny-stack\.service/your-project.service/g' "$file"

  echo "  ✓ Updated: $file"
done

echo ""
echo "================================================"
echo "✅ Sanitization Complete"
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
echo "To restore backups:"
echo "  for f in *.backup; do mv \"\$f\" \"\${f%.backup}\"; done"
echo ""
echo "To remove backups:"
echo "  rm -f *.backup"
echo ""
echo "================================================"
