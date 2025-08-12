from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from contextlib import asynccontextmanager
import os
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
import asyncio

# 🔧 DEBUG: Setup comprehensive logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app_logger = logging.getLogger("sunny_main")
app_logger.info(f"🚀 SUNNY PLATFORM STARTING [{datetime.now().isoformat()}]")

from .routes import claude_integration, project_management, client_analysis, proposal_engine, metrics_tracking, self_improvement_api, auth_routes, app_router, auth, security_monitor, navigator_helm, test_json
from .auth import google_oauth
from .utils.debug_helper import debug, debug_decorator
from .websocket_server import create_socketio_app, sio
from .services.self_analysis import safe_self_improvement_orchestrator
from .middleware.auth_middleware import auth_middleware
from .middleware.ip_whitelist import IPWhitelistMiddleware
from .middleware.bot_protection import BotProtectionMiddleware
from .middleware.rate_limiter import RateLimiterMiddleware
from .middleware.emergency_access_logger import emergency_logger

load_dotenv()

# Daily self-improvement routine - disabled temporarily for stability
# Will be re-enabled after full Claude Code integration
async def daily_self_improvement():
    """Daily self-improvement routine - currently disabled"""
    debug("SELF_IMPROVEMENT", "Daily self-improvement scheduled for future implementation")
    # Implementation will be restored after Claude Code integration
    pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    debug("STARTUP", "Sunny backend initializing", version="1.0.0")
    
    # Daily self-improvement will be enabled after Claude Code integration
    # asyncio.create_task(daily_self_improvement())
    debug("STARTUP", "Self-improvement system ready (manual trigger mode)")
    
    yield
    debug("SHUTDOWN", "Sunny backend shutting down")

# CRITICAL: Disable slash redirects to prevent /api/mcp -> /api/mcp/ redirect
app = FastAPI(
    title="Sunny Consulting Platform API",
    description="AI-Powered Software Consulting Backend",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)
app_logger.info("✅ FastAPI app created with redirect_slashes=False")

# Global exception handler to ensure proper JSON responses
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    """Ensure HTTP exceptions return valid JSON"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Ensure validation errors return valid JSON"""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Catch-all for unexpected errors"""
    app_logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# SECURITY MIDDLEWARE STACK - Order matters!
# 1. Bot Protection - First line of defense (TEMPORARILY DISABLED FOR TESTING)
# app.add_middleware(
#     BotProtectionMiddleware,
#     rate_limit_window=60,
#     rate_limit_max_requests=100,
#     block_duration=3600  # 1 hour block for malicious IPs
# )

# 2. Rate Limiting - Prevent abuse (TEMPORARILY DISABLED FOR TESTING)
# app.add_middleware(
#     RateLimiterMiddleware,
#     enable_adaptive=True,
#     block_duration=300  # 5 minute blocks for rate limit violations
# )

# 3. CORS - Configure allowed origins
# Get environment-based origins
PRODUCTION_MODE = os.getenv("PRODUCTION_MODE", "false").lower() == "true"

if PRODUCTION_MODE:
    # Production origins
    allowed_origins = [
        "https://sunny-stack.com",
        "https://www.sunny-stack.com",
        "https://*.sunny-stack.com",  # Allow all subdomains
    ]
else:
    # Development origins - allow localhost and production for testing
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",  
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",  
        "http://127.0.0.1:3002",
        "https://sunny-stack.com",
        "https://www.sunny-stack.com",
        "https://*.sunny-stack.com",  # Allow all subdomains
    ]

# CORS Configuration with debugging
app_logger.info(f"🌐 CORS ORIGINS: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],  # Includes x-api-key
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "content-type"],
    max_age=3600
)
app_logger.info("✅ CORS middleware configured with credentials support")

# 4. IP Whitelist - Optional extra security layer
# MCP paths removed - they need public access
app.add_middleware(
    IPWhitelistMiddleware,
    protected_paths=["/api/admin", "/api/self-improvement"]
)

# 5. Authentication - Final authorization check
@app.middleware("http")
async def add_auth_middleware(request, call_next):
    return await auth_middleware(request, call_next)

# EMERGENCY ACCESS LOGGING - Track all access during development mode
@app.middleware("http")
async def emergency_access_logging(request, call_next):
    """Log all access attempts during emergency mode"""
    # Log the incoming request
    await emergency_logger.log_access(request)
    
    # Process the request
    response = await call_next(request)
    
    # Log with response status
    await emergency_logger.log_access(request, response.status_code)
    
    return response

# Authentication routes (no auth required for login)
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])  # OLD AUTH - DISABLED
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])  # NEW SECURE AUTH SYSTEM
app.include_router(app_router.router, prefix="", tags=["Application Router"])

# Google OAuth routes for MCP authentication
app.include_router(google_oauth.router, prefix="/api/oauth/google", tags=["OAuth"])


# Protected API routes
app.include_router(claude_integration.router, prefix="/api/claude", tags=["Claude Integration"])
app.include_router(project_management.router, prefix="/api/projects", tags=["Project Management"])
app.include_router(client_analysis.router, prefix="/api/analysis", tags=["Client Analysis"])
app.include_router(proposal_engine.router, prefix="/api/proposals", tags=["Proposal Engine"])
app.include_router(metrics_tracking.router, prefix="/api/metrics", tags=["Metrics Tracking"])
app.include_router(self_improvement_api.router, prefix="/api/self-improvement", tags=["Self Improvement"])
app.include_router(security_monitor.router, tags=["Security Monitoring"])

# Navigator's Helm Integration
app.include_router(navigator_helm.router, prefix="/api", tags=["Navigator's Helm"])

# Test JSON endpoints (temporary for debugging)
app.include_router(test_json.router, prefix="/api/test", tags=["Testing"])

@app.get("/")
@debug_decorator("API")
async def root():
    return {
        "service": "Sunny Consulting Platform",
        "status": "operational",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "claude": "/api/claude",
            "projects": "/api/projects",
            "analysis": "/api/analysis",
            "proposals": "/api/proposals",
            "metrics": "/api/metrics",
            "self_improvement": "/api/self-improvement"
        }
    }

@app.get("/health")
@debug_decorator("API")
async def health_check():
    debug("API", "Health check requested")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


app_logger.info("🎯 SUNNY PLATFORM INITIALIZATION COMPLETE")


@app.get("/emergency/access-logs")
@debug_decorator("API")
async def get_emergency_access_logs():
    """Get summary of all access during emergency mode"""
    return emergency_logger.get_access_summary()


# Create the complete ASGI app with Socket.IO
asgi_app = create_socketio_app(app)

if __name__ == "__main__":
    debug("STARTUP", "Starting Sunny backend server with WebSocket support", port=8000)
    uvicorn.run(
        "app.main:asgi_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )