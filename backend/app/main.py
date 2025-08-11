from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from contextlib import asynccontextmanager
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import asyncio

from .routes import claude_integration, project_management, client_analysis, proposal_engine, metrics_tracking, mcp_api, self_improvement_api, auth_routes, app_router
from .utils.debug_helper import debug, debug_decorator
from .websocket_server import create_socketio_app, sio
from .services.mcp_service import mcp_service
from .services.self_analysis import safe_self_improvement_orchestrator
from .middleware.auth_middleware import auth_middleware

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
    # Initialize MCP service
    await mcp_service.start_service()
    debug("STARTUP", "MCP service initialized successfully")
    
    # Daily self-improvement will be enabled after Claude Code integration
    # asyncio.create_task(daily_self_improvement())
    debug("STARTUP", "Self-improvement system ready (manual trigger mode)")
    
    yield
    debug("SHUTDOWN", "Sunny backend shutting down")

app = FastAPI(
    title="Sunny Consulting Platform API",
    description="AI-Powered Software Consulting Backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",  
        "http://localhost:3002",  # Add support for port 3002
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",  
        "http://127.0.0.1:3002",  # Add support for 127.0.0.1:3002
        "https://sunny-stack.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add authentication middleware
@app.middleware("http")
async def add_auth_middleware(request, call_next):
    return await auth_middleware(request, call_next)

# Authentication routes (no auth required for login)
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(app_router.router, prefix="", tags=["Application Router"])

# Protected API routes
app.include_router(claude_integration.router, prefix="/api/claude", tags=["Claude Integration"])
app.include_router(project_management.router, prefix="/api/projects", tags=["Project Management"])
app.include_router(client_analysis.router, prefix="/api/analysis", tags=["Client Analysis"])
app.include_router(proposal_engine.router, prefix="/api/proposals", tags=["Proposal Engine"])
app.include_router(metrics_tracking.router, prefix="/api/metrics", tags=["Metrics Tracking"])
app.include_router(mcp_api.router, prefix="/api/mcp", tags=["MCP Connector"])
app.include_router(self_improvement_api.router, prefix="/api/self-improvement", tags=["Self Improvement"])

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
            "mcp": "/api/mcp",
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