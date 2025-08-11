#!/bin/bash

# Sunny AI Platform - Production Deployment Script
# Deploy to sunny-stack.com via Cloudflare Workers

echo "=========================================="
echo "  SUNNY AI PLATFORM DEPLOYMENT"
echo "  Target: sunny-stack.com"
echo "  Version: 2.0-sentient"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Wrangler CLI is not installed!${NC}"
    echo "Installing wrangler globally..."
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
echo -e "${YELLOW}[2/8] Checking Cloudflare authentication...${NC}"
wrangler whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Cloudflare. Starting login process...${NC}"
    wrangler login
fi

echo -e "${GREEN}Prerequisites checked!${NC}"

# Step 3: Install dependencies
echo -e "${YELLOW}[3/8] Installing dependencies...${NC}"
npm install hono

# Step 4: Create KV namespace if it doesn't exist
echo -e "${YELLOW}[4/8] Setting up KV namespace...${NC}"
wrangler kv:namespace create "SUNNY_KV" --env production 2>/dev/null || echo "KV namespace already exists"

# Step 5: Create D1 database
echo -e "${YELLOW}[5/8] Setting up D1 database...${NC}"
DB_EXISTS=$(wrangler d1 list | grep "sunny-production")
if [ -z "$DB_EXISTS" ]; then
    echo "Creating new D1 database..."
    wrangler d1 create sunny-production
else
    echo "D1 database already exists"
fi

# Step 6: Execute database schema
echo -e "${YELLOW}[6/8] Initializing database schema...${NC}"
wrangler d1 execute sunny-production --file=./database/schema.sql --env production

# Step 7: Deploy to production
echo -e "${YELLOW}[7/8] Deploying to Cloudflare Workers...${NC}"
wrangler deploy --env production

# Step 8: Set secrets (manual step)
echo -e "${YELLOW}[8/8] Setting up secrets...${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Set the following secrets in Cloudflare dashboard:${NC}"
echo "1. MASTER_PASSWORD - Your secure master password for luka@sunny-stack.com"
echo "2. JWT_SECRET - A 256-bit secret for JWT signing"
echo "3. ANTHROPIC_API_KEY - Your production Anthropic API key"
echo ""
echo "To set secrets via CLI:"
echo "  wrangler secret put MASTER_PASSWORD --env production"
echo "  wrangler secret put JWT_SECRET --env production"
echo "  wrangler secret put ANTHROPIC_API_KEY --env production"
echo ""

# Deployment complete
echo "=========================================="
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Platform URLs:"
echo "  Main: https://sunny-stack.com"
echo "  Health: https://sunny-stack.com/health"
echo "  MCP Status: https://sunny-stack.com/api/mcp/status"
echo ""
echo "Next steps:"
echo "1. Set the required secrets in Cloudflare dashboard"
echo "2. Test authentication at https://sunny-stack.com/api/auth/login"
echo "3. Configure Claude MCP connector:"
echo "   - URL: https://sunny-stack.com/api/mcp"
echo "   - Name: Sunny Development Monitor"
echo ""
echo -e "${GREEN}Sunny AI Platform is now LIVE at sunny-stack.com!${NC}"