#!/bin/bash
# 🔧 Sunny AI Platform - Development Utilities

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${2:-$GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

show_help() {
    echo ""
    log "🔧 SUNNY DEVELOPMENT UTILITIES" $BLUE
    echo ""
    echo "Usage: ./dev-sunny.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  logs         - Show recent service logs"
    echo "  restart      - Quick restart all services"
    echo "  backend      - Restart backend only"
    echo "  frontend     - Restart frontend only"
    echo "  tunnel       - Restart tunnel only"
    echo "  test-auth    - Test authentication endpoints"
    echo "  git-status   - Show git status with formatting"
    echo "  clean        - Clean node_modules and Python cache"
    echo ""
}

case "$1" in
    "logs")
        log "📋 Recent logs..." $BLUE
        echo "=== BACKEND LOGS ==="
        tail -20 logs/backend.log 2>/dev/null || echo "No backend logs"
        echo "=== FRONTEND LOGS ==="
        tail -20 logs/frontend.log 2>/dev/null || echo "No frontend logs"
        ;;
    "restart")
        log "🔄 Restarting all services..." $YELLOW
        ./stop-sunny.sh
        sleep 3
        ./startup-sunny.sh
        ;;
    "backend")
        log "🔄 Restarting backend..." $YELLOW
        pkill -f "uvicorn"
        sleep 2
        cd backend && python -m uvicorn app.main:asgi_app --reload --host 0.0.0.0 --port 8000 &
        cd ..
        ;;
    "frontend")
        log "🔄 Restarting frontend..." $YELLOW
        pkill -f "npm run dev"
        sleep 2
        cd frontend && npm run dev -- --port 3000 &
        cd ..
        ;;
    "tunnel")
        log "🔄 Restarting tunnel..." $YELLOW
        pkill -f "cloudflared"
        sleep 2
        cloudflared tunnel --config "/c/Users/lukaf/.cloudflared/sunny-config.yml" run &
        ;;
    "test-auth")
        log "🧪 Testing authentication..." $BLUE
        curl -s "http://localhost:8000/health" && log "✅ Backend responding" || log "❌ Backend down"
        curl -s "https://sunny-stack.com" && log "✅ Tunnel responding" || log "❌ Tunnel down"
        ;;
    "git-status")
        log "📊 Git repository status..." $BLUE
        git status --short
        echo ""
        git log --oneline -5
        ;;
    "clean")
        log "🧹 Cleaning build artifacts..." $YELLOW
        rm -rf frontend/node_modules frontend/.next
        find backend -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find backend -name "*.pyc" -delete 2>/dev/null || true
        log "✅ Clean complete" $GREEN
        ;;
    *)
        show_help
        ;;
esac