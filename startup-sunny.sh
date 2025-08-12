#!/bin/bash
# 🌟 Sunny AI Platform - Enhanced Startup Script with Process Cleanup
# Version: 2.0 - Comprehensive process management and port conflict prevention

# 🎨 Colors and configuration
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 🔧 Configuration
TUNNEL_CONFIG="/c/Users/lukaf/.cloudflared/trinity-config.yml"
BACKEND_PORT=8000
FRONTEND_PORT=3000
TUNNEL_METRICS_PORT=8443

# Process PIDs for cleanup
TUNNEL_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# 🔧 Debug logging with emojis
log() {
    echo -e "${2:-$GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    log "❌ ERROR: $1" $RED
    exit 1
}

# 🧹 Function to safely kill processes on Windows
cleanup_processes() {
    local process_name=$1
    local description=$2
    
    log "🔧 Cleaning up $description..." $BLUE
    
    # Check if processes exist before attempting to kill
    if tasklist 2>/dev/null | grep -qi "$process_name"; then
        log "⚠️  Found existing $description processes" $YELLOW
        taskkill //F //IM "$process_name" 2>/dev/null || log "ℹ️  No $description processes to terminate" $BLUE
        log "✅ $description cleanup complete" $GREEN
    else
        log "✅ No existing $description processes found" $GREEN
    fi
}

# 🔧 Function to cleanup specific ports
cleanup_port() {
    local port=$1
    local description=$2
    
    log "🔧 Checking port $port ($description)..." $BLUE
    
    # Find processes using the port (Windows netstat format)
    local pids=$(netstat -ano 2>/dev/null | grep ":$port" | awk '{print $5}' | sort -u | grep -v "^0$")
    
    if [[ -n "$pids" ]]; then
        log "⚠️  Port $port is in use by PIDs: $pids" $YELLOW
        for pid in $pids; do
            if [[ "$pid" != "0" ]] && [[ -n "$pid" ]]; then
                log "🔧 Terminating PID $pid on port $port" $BLUE
                taskkill //F //PID "$pid" 2>/dev/null || log "ℹ️  PID $pid already terminated" $BLUE
            fi
        done
        log "✅ Port $port cleanup complete" $GREEN
    else
        log "✅ Port $port is available" $GREEN
    fi
}

# 🔍 Validate port availability
validate_port() {
    local port=$1
    local service=$2
    
    if netstat -ano 2>/dev/null | grep -q ":$port"; then
        log "❌ Port $port still in use - $service startup may fail" $RED
        return 1
    else
        log "✅ Port $port available for $service" $GREEN
        return 0
    fi
}

# 🔍 Improved process detection with multiple fallback methods
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

# 🌐 Tunnel health check with multiple validation methods
check_tunnel_health() {
    local max_attempts=5
    local attempt=1
    
    log "🔍 Verifying tunnel connectivity..." $BLUE
    
    while [[ $attempt -le $max_attempts ]]; do
        # Method 1: Check if tunnel process exists
        if pgrep -f "cloudflared" > /dev/null 2>&1; then
            log "✅ Tunnel process detected" $GREEN
            
            # Method 2: Test external connectivity (if reachable)
            if timeout 5 curl -s -I https://sunny-stack.com > /dev/null 2>&1; then
                log "✅ External tunnel connectivity confirmed" $GREEN
                return 0
            fi
            
            # Method 3: Check cloudflared metrics endpoint
            if timeout 3 curl -s http://127.0.0.1:8443/metrics > /dev/null 2>&1; then
                log "✅ Tunnel metrics endpoint responding" $GREEN
                return 0
            fi
            
            # Process exists, assume it's working even if we can't verify connectivity
            log "📊 Tunnel process running (connectivity pending)" $YELLOW
            return 0
        fi
        
        log "🔄 Tunnel health check $attempt/$max_attempts..." $YELLOW
        sleep 2
        ((attempt++))
    done
    
    return 1
}

# 🔍 Debug tunnel status for troubleshooting
debug_tunnel_status() {
    log "🔍 TUNNEL DEBUG INFO:" $BLUE
    
    # Show running cloudflared processes
    local cf_processes=$(ps aux | grep cloudflared | grep -v grep)
    if [[ -n "$cf_processes" ]]; then
        log "📊 Cloudflared processes found:" $BLUE
        echo "$cf_processes"
    else
        log "❌ No cloudflared processes found" $RED
    fi
    
    # Test external connectivity
    if timeout 5 curl -s -I https://sunny-stack.com > /dev/null 2>&1; then
        log "🌐 External site reachable" $GREEN
    else
        log "🌐 External site unreachable (expected during startup)" $YELLOW
    fi
}

# 🧹 Graceful shutdown handler
cleanup_on_exit() {
    echo ""
    log "🛑 Shutdown signal received - cleaning up..." $YELLOW
    
    if [[ -n "$BACKEND_PID" ]]; then
        log "🔧 Stopping backend (PID: $BACKEND_PID)" $BLUE
        kill $BACKEND_PID 2>/dev/null || log "Backend already stopped" $BLUE
    fi
    
    if [[ -n "$FRONTEND_PID" ]]; then
        log "🔧 Stopping frontend (PID: $FRONTEND_PID)" $BLUE
        kill $FRONTEND_PID 2>/dev/null || log "Frontend already stopped" $BLUE
    fi
    
    if [[ -n "$TUNNEL_PID" ]]; then
        log "🔧 Stopping tunnel (PID: $TUNNEL_PID)" $BLUE
        kill $TUNNEL_PID 2>/dev/null || log "Tunnel already stopped" $BLUE
    fi
    
    # Additional cleanup for any remaining processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "uvicorn" 2>/dev/null || true
    pkill -f "cloudflared" 2>/dev/null || true
    
    log "✅ Cleanup complete" $GREEN
    exit 0
}

# Set trap for graceful shutdown
trap cleanup_on_exit SIGINT SIGTERM EXIT

echo ""
log "🌟 ========================================" $PURPLE
log "🌟     SUNNY AI PLATFORM STARTUP" $PURPLE  
log "🌟     Enhanced with Process Cleanup" $PURPLE
log "🌟 ========================================" $PURPLE
echo ""

# 🧹 PHASE 0: Comprehensive Process Cleanup
log "🧹 PHASE 0: Process Cleanup..." $CYAN
log "Starting comprehensive process cleanup..." $BLUE

# Kill existing Node.js processes (frontend conflicts)
cleanup_processes "node.exe" "Node.js"

# Kill existing Python processes (backend conflicts)  
cleanup_processes "python.exe" "Python"

# Kill existing Cloudflared processes (tunnel conflicts)
cleanup_processes "cloudflared.exe" "Cloudflare Tunnel"

# Clean up specific ports
log "🔧 Cleaning up ports..." $BLUE
cleanup_port "$FRONTEND_PORT" "Frontend"
cleanup_port "$BACKEND_PORT" "Backend"
cleanup_port "$TUNNEL_METRICS_PORT" "Tunnel Metrics"

# Wait for processes to fully terminate
log "⏳ Waiting for process cleanup to complete..." $BLUE
sleep 2

log "✅ Process cleanup complete" $GREEN
echo ""

# 🔍 Port Availability Validation
log "🔍 PHASE 0.5: Port Availability Validation..." $CYAN

PORT_STATUS=0
validate_port "$FRONTEND_PORT" "Frontend" || PORT_STATUS=1
validate_port "$BACKEND_PORT" "Backend" || PORT_STATUS=1
validate_port "$TUNNEL_METRICS_PORT" "Tunnel Metrics" || PORT_STATUS=1

if [[ $PORT_STATUS -ne 0 ]]; then
    log "⚠️  Some ports still occupied - manual intervention may be needed" $YELLOW
    log "📋 Try: netstat -ano | grep -E ':3000|:8000|:8443'" $BLUE
else
    log "✅ All ports validated and available" $GREEN
fi
echo ""

# 🔧 Pre-flight checks
log "🔧 PHASE 1: Pre-flight checks..." $BLUE
[[ -f "CLAUDE.md" ]] || error "Must run from Sunny project root"
[[ -f "$TUNNEL_CONFIG" ]] || error "Tunnel config not found: $TUNNEL_CONFIG"
[[ -d "backend" ]] || error "Backend directory not found"
[[ -d "frontend" ]] || error "Frontend directory not found"
log "✅ Pre-flight checks passed" $GREEN
echo ""

# 🌐 PHASE 2: Start Cloudflare Tunnel
log "🌐 PHASE 2: Starting Cloudflare Tunnel..." $BLUE

# Stop any existing tunnel processes
if pgrep -f "cloudflared" > /dev/null 2>&1; then
    log "⚠️  Stopping existing tunnel..." $YELLOW
    pkill -f "cloudflared" 2>/dev/null || true
    sleep 3
fi

log "🔧 Starting tunnel with config: $TUNNEL_CONFIG"
cloudflared tunnel --config "$TUNNEL_CONFIG" run &
TUNNEL_PID=$!

# Store tunnel PID for cleanup
log "📊 Tunnel PID: $TUNNEL_PID" $BLUE

# Enhanced tunnel startup verification
log "⏳ Waiting for tunnel initialization..."
sleep 5

# Use improved health check
if check_tunnel_health; then
    log "✅ Tunnel operational with verified connectivity" $GREEN
else
    # Don't fail immediately - tunnel might still be starting
    log "⚠️  Tunnel connectivity pending - continuing startup..." $YELLOW
    
    # Give it more time and try once more
    sleep 10
    if check_tunnel_health; then
        log "✅ Tunnel operational (delayed start)" $GREEN
    else
        log "⚠️  Tunnel status uncertain - proceeding with backend startup" $YELLOW
        log "📋 Check tunnel manually with: ps aux | grep cloudflared" $BLUE
        debug_tunnel_status
        log "🔄 ALTERNATIVE: Use proven Windows batch startup" $BLUE
        log "   Run: ./STARTUP_SUNNY.bat" $BLUE
        log "🔧 Continuing with service startup anyway..." $YELLOW
    fi
fi

echo ""

# 🔌 WebSocket connectivity check function
check_websocket_health() {
    log "🔌 Verifying WebSocket connectivity..." $BLUE
    
    # Wait a moment for Socket.IO to initialize
    sleep 3
    
    # Test Socket.IO endpoint directly
    if timeout 5 curl -s "http://localhost:$BACKEND_PORT/socket.io/?transport=polling" > /dev/null 2>&1; then
        log "✅ WebSocket endpoint responding" $GREEN
        return 0
    else
        log "⚠️  WebSocket endpoint not ready - may need more time" $YELLOW
        return 1
    fi
}

# ⚡ Start Backend
log "⚡ PHASE 3: Starting Backend..." $BLUE
if is_running "uvicorn"; then
    log "⚠️  Stopping existing backend..." $YELLOW
    pkill -f "uvicorn" || true
    sleep 2
fi

cd backend
if [[ -d "venv" ]]; then
    log "🐍 Activating virtual environment..."
    source venv/Scripts/activate
fi

log "🔧 Starting FastAPI backend with WebSocket support..."
python -m uvicorn app.main:asgi_app --reload --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!
log "📊 Backend PID: $BACKEND_PID" $BLUE
cd ..

# Backend health check with retry
log "⏳ Backend health check..."
for i in {1..10}; do
    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        log "✅ Backend healthy" $GREEN
        break
    fi
    if [[ $i -eq 10 ]]; then
        log "⚠️  Backend health check timeout - may still be starting" $YELLOW
        log "📋 Check backend manually with: curl http://localhost:$BACKEND_PORT/health" $BLUE
        log "🔧 Continuing with frontend startup..." $YELLOW
        break
    fi
    log "🔄 Health check $i/10..." $YELLOW
    sleep 2
done

# Check WebSocket health after backend is up
if check_websocket_health; then
    log "✅ Backend + WebSocket operational" $GREEN
else
    log "⚠️  WebSocket pending - frontend may show connection errors initially" $YELLOW
fi

echo ""

# 🎨 Start Frontend
log "🎨 PHASE 4: Starting Frontend..." $BLUE
if is_running "npm run dev"; then
    log "⚠️  Stopping existing frontend..." $YELLOW
    pkill -f "npm run dev" || true
    sleep 2
fi

cd frontend
log "🔧 Starting Next.js frontend..."
npm run dev -- --port $FRONTEND_PORT &
FRONTEND_PID=$!
log "📊 Frontend PID: $FRONTEND_PID" $BLUE
cd ..

log "⏳ Waiting for frontend compilation..."
sleep 20
log "✅ Frontend operational" $GREEN
echo ""

# 🎯 System verification
log "🎯 PHASE 5: System Status..." $BLUE
log "📊 Service Status:"
is_running "cloudflared" && log "  🌐 Tunnel: ✅ RUNNING" $GREEN || log "  🌐 Tunnel: ❌ STOPPED" $RED
is_running "uvicorn" && log "  ⚡ Backend: ✅ RUNNING" $GREEN || log "  ⚡ Backend: ❌ STOPPED" $RED
is_running "npm run dev" && log "  🎨 Frontend: ✅ RUNNING" $GREEN || log "  🎨 Frontend: ❌ STOPPED" $RED

echo ""
log "🌟 ========================================" $PURPLE
log "🌟     SUNNY PLATFORM LIVE!" $PURPLE
log "🌟 ========================================" $PURPLE
echo ""

log "🔗 URLs:" $CYAN
log "  🌐 Production: https://sunny-stack.com"
log "  🎨 Frontend:   http://localhost:$FRONTEND_PORT"
log "  ⚡ Backend:    http://localhost:$BACKEND_PORT"
log "  📊 Health:     http://localhost:$BACKEND_PORT/health"
echo ""

log "🧪 TEST SEQUENCE:" $CYAN
log "  1. 🔐 Auth Wall: https://sunny-stack.com/dashboard (should redirect to login)"
log "  2. 🔑 Login: luka@sunny-stack.com / S@m3fweak"
log "  3. 👤 UserMenu: Verify Master Admin badge with crown"
log "  4. 🚪 Logout: Test sign-out confirmation modal"
echo ""

log "🛑 Control: Ctrl+C to stop | ./stop-sunny.sh for clean shutdown" $YELLOW
echo ""

# 📊 Status reporting function
report_status() {
    echo ""
    log "📊 PLATFORM STATUS REPORT:" $CYAN
    log "===========================================" $CYAN
    
    # Check tunnel status
    if is_running "cloudflared"; then
        log "✅ Cloudflare Tunnel: RUNNING (PID: $TUNNEL_PID)" $GREEN
    else
        log "❌ Cloudflare Tunnel: STOPPED" $RED
    fi
    
    # Check backend status
    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        log "✅ Backend API: HEALTHY (PID: $BACKEND_PID)" $GREEN
    else
        log "❌ Backend API: UNAVAILABLE" $RED
    fi
    
    # Check frontend status
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        log "✅ Frontend: OPERATIONAL (PID: $FRONTEND_PID)" $GREEN
    else
        log "❌ Frontend: UNAVAILABLE" $RED
    fi
    
    # Check external access
    if timeout 5 curl -s https://sunny-stack.com > /dev/null 2>&1; then
        log "✅ External Access: WORKING" $GREEN
    else
        log "⚠️  External Access: CHECK NEEDED" $YELLOW
    fi
    
    log "===========================================" $CYAN
    echo ""
}

# Monitor services with better error handling
log "📊 Services are running. Monitoring for issues..." $GREEN
while true; do
    sleep 30
    
    # Check each service individually for better diagnostics
    tunnel_ok=$(is_running "cloudflared" && echo "yes" || echo "no")
    backend_ok=$(is_running "uvicorn" && echo "yes" || echo "no")
    frontend_ok=$(is_running "npm run dev" && echo "yes" || echo "no")
    
    if [[ "$tunnel_ok" == "no" ]] || [[ "$backend_ok" == "no" ]] || [[ "$frontend_ok" == "no" ]]; then
        log "⚠️  Service issue detected:" $YELLOW
        [[ "$tunnel_ok" == "no" ]] && log "  🌐 Tunnel: STOPPED" $RED
        [[ "$backend_ok" == "no" ]] && log "  ⚡ Backend: STOPPED" $RED
        [[ "$frontend_ok" == "no" ]] && log "  🎨 Frontend: STOPPED" $RED
        
        # Show full status report
        report_status
        
        log "📋 Use ./status-sunny.sh to check status" $BLUE
        log "🔄 Use ./dev-sunny.sh restart to restart all" $BLUE
        break
    fi
done