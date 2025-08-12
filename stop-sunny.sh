#!/bin/bash
# 🛑 Sunny AI Platform - Stop Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${2:-$GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

log "🛑 Stopping Sunny AI Platform..." $YELLOW

# Graceful shutdown
pkill -f "npm run dev" 2>/dev/null && log "🎨 Frontend stopped" || log "🎨 Frontend not running"
sleep 2
pkill -f "uvicorn" 2>/dev/null && log "⚡ Backend stopped" || log "⚡ Backend not running"
sleep 2  
pkill -f "cloudflared" 2>/dev/null && log "🌐 Tunnel stopped" || log "🌐 Tunnel not running"

log "✅ All services stopped" $GREEN