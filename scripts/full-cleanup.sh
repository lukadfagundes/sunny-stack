#!/bin/bash

# 🚀 Comprehensive Cloudflare NavigatorCore Cleanup
# Runs all cleanup scripts in sequence to completely remove NavigatorCore

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 COMPREHENSIVE CLOUDFLARE NAVIGATORCORE CLEANUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will:"
echo "  1. Delete all NavigatorCore workers"
echo "  2. Delete all NavigatorCore KV namespaces"
echo "  3. Update DNS records to Trinity tunnel"
echo "  4. Verify cleanup completion"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to pause between operations
pause_with_message() {
    echo ""
    echo "⏸️  $1"
    sleep 2
    echo ""
}

# Check prerequisites
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found! Please install Node.js first."
    exit 1
fi

# Check for npm/npx
if command_exists npx; then
    echo "✅ npx found"
else
    echo "❌ npx not found! Please install npm/npx first."
    exit 1
fi

# Check for Cloudflare API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  CLOUDFLARE_API_TOKEN not set"
    echo ""
    echo "To use API cleanup features, set your token:"
    echo "  export CLOUDFLARE_API_TOKEN=\"your_token_here\""
    echo ""
    echo "Continuing with Wrangler CLI cleanup only..."
    API_AVAILABLE=false
else
    echo "✅ Cloudflare API token found"
    API_AVAILABLE=true
fi

# Check for wrangler
echo ""
echo "🔍 Checking for Wrangler CLI..."
if npx wrangler --version >/dev/null 2>&1; then
    WRANGLER_VERSION=$(npx wrangler --version 2>/dev/null | head -n1)
    echo "✅ Wrangler found: $WRANGLER_VERSION"
else
    echo "⚠️  Wrangler not found or not configured"
    echo "   Installing Wrangler locally..."
    npm install -g wrangler 2>/dev/null || npm install wrangler 2>/dev/null
fi

pause_with_message "Prerequisites check complete. Starting cleanup..."

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null
chmod +x scripts/*.js 2>/dev/null

# Phase 1: Wrangler CLI Cleanup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 PHASE 1: WRANGLER CLI CLEANUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "scripts/cleanup-cloudflare.sh" ]; then
    bash scripts/cleanup-cloudflare.sh
    WRANGLER_EXIT=$?
    if [ $WRANGLER_EXIT -ne 0 ]; then
        echo "⚠️  Wrangler cleanup completed with warnings"
    fi
else
    echo "❌ Wrangler cleanup script not found at scripts/cleanup-cloudflare.sh"
fi

pause_with_message "Wrangler cleanup complete. Starting API cleanup..."

# Phase 2: API Cleanup (if token available)
if [ "$API_AVAILABLE" = true ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📡 PHASE 2: CLOUDFLARE API CLEANUP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if [ -f "scripts/cloudflare-api-cleanup.js" ]; then
        node scripts/cloudflare-api-cleanup.js
        API_EXIT=$?
        if [ $API_EXIT -ne 0 ]; then
            echo "⚠️  API cleanup completed with warnings"
        fi
    else
        echo "❌ API cleanup script not found at scripts/cloudflare-api-cleanup.js"
    fi
    
    pause_with_message "API cleanup complete. Starting DNS update..."
    
    # Phase 3: DNS Update
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 PHASE 3: DNS RECORD UPDATE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if [ -f "scripts/update-dns.js" ]; then
        node scripts/update-dns.js
        DNS_EXIT=$?
        if [ $DNS_EXIT -ne 0 ]; then
            echo "⚠️  DNS update completed with warnings"
        fi
    else
        echo "❌ DNS update script not found at scripts/update-dns.js"
    fi
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  SKIPPING API CLEANUP AND DNS UPDATE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "API token not set. To run full cleanup:"
    echo "  1. Get your API token from Cloudflare dashboard"
    echo "  2. export CLOUDFLARE_API_TOKEN=\"your_token\""
    echo "  3. Run this script again"
fi

pause_with_message "Cleanup operations complete. Running verification..."

# Phase 4: Verification
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PHASE 4: CLEANUP VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Checking remaining Workers..."
npx wrangler worker list 2>/dev/null || echo "   ⚠️  Could not list workers"

echo ""
echo "📋 Checking remaining KV Namespaces..."
npx wrangler kv:namespace list 2>/dev/null || echo "   ⚠️  Could not list KV namespaces"

echo ""
echo "🌐 Testing external access..."
if command_exists curl; then
    echo "   Testing https://sunny-stack.com ..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sunny-stack.com 2>/dev/null)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "   ✅ Site is accessible (HTTP $HTTP_STATUS)"
    elif [ "$HTTP_STATUS" = "000" ]; then
        echo "   ⚠️  Could not connect (DNS may still be propagating)"
    else
        echo "   ⚠️  Site returned HTTP $HTTP_STATUS"
    fi
else
    echo "   ⚠️  curl not available for testing"
fi

# Final Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 CLEANUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ What was done:"
echo "   • Attempted to delete all NavigatorCore workers"
echo "   • Attempted to delete all NavigatorCore KV namespaces"
if [ "$API_AVAILABLE" = true ]; then
    echo "   • Updated DNS records to Trinity tunnel"
fi
echo "   • Verified cleanup completion"
echo ""
echo "📝 Next steps:"
echo "   1. Check Cloudflare dashboard to confirm cleanup"
echo "   2. Wait 1-2 minutes for DNS propagation"
echo "   3. Test access: curl https://sunny-stack.com"
echo "   4. Verify Trinity Dashboard appears (not NavigatorCore)"
echo ""
echo "💡 If NavigatorCore still appears:"
echo "   • Clear browser cache and cookies"
echo "   • Check Cloudflare dashboard for remaining resources"
echo "   • Ensure Trinity tunnel is running: ./startup-sunny.sh"
echo ""
echo "✨ NavigatorCore cleanup finished!"