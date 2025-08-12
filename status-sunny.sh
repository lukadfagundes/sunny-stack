#!/bin/bash
# 📊 Sunny AI Platform - Status Check

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${2:-$GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

# Improved process detection with multiple fallback methods
is_running() {
    local process_name="$1"
    case "$process_name" in
        "cloudflared")
            # Multiple detection methods for tunnel
            pgrep -f "cloudflared" > /dev/null 2>&1 || \
            pgrep -f "tunnel.*run" > /dev/null 2>&1 || \
            ps aux | grep -v grep | grep "cloudflared" > /dev/null 2>&1
            ;;
        "uvicorn")
            # Backend detection
            pgrep -f "uvicorn" > /dev/null 2>&1 || \
            ps aux | grep -v grep | grep "uvicorn.*app.main:app" > /dev/null 2>&1
            ;;
        "npm run dev")
            # Frontend detection  
            pgrep -f "npm.*dev" > /dev/null 2>&1 || \
            pgrep -f "next.*dev" > /dev/null 2>&1 || \
            ps aux | grep -v grep | grep "npm run dev" > /dev/null 2>&1
            ;;
        *)
            pgrep -f "$process_name" > /dev/null 2>&1
            ;;
    esac
}

echo ""
log "📊 SUNNY PLATFORM STATUS" $BLUE
echo ""

is_running "cloudflared" && log "🌐 Tunnel:  ✅ RUNNING" $GREEN || log "🌐 Tunnel:  ❌ STOPPED" $RED
is_running "uvicorn" && log "⚡ Backend: ✅ RUNNING" $GREEN || log "⚡ Backend: ❌ STOPPED" $RED  
is_running "npm run dev" && log "🎨 Frontend: ✅ RUNNING" $GREEN || log "🎨 Frontend: ❌ STOPPED" $RED

echo ""
if is_running "cloudflared" && is_running "uvicorn" && is_running "npm run dev"; then
    log "🌟 ALL SYSTEMS OPERATIONAL" $GREEN
    log "🔗 Access: https://sunny-stack.com" $BLUE
else
    log "⚠️  Some services down - run ./startup-sunny.sh" $RED
fi
echo ""