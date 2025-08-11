"""
Authentication Middleware
Protects API routes with JWT authentication
"""

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List

from ..auth.auth_system import auth_system
from ..utils.debug_helper import debug

# Routes that don't require authentication
PUBLIC_ROUTES = [
    "/",
    "/health",
    "/api/auth/login",
    "/api/auth/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/mcp/status",  # Temporarily public for testing
    "/api/mcp/health"   # Temporarily public for testing
]

# Routes that require specific permissions
PERMISSION_MAP = {
    "/api/projects": ["projects.read"],
    "/api/analysis": ["analytics.read"],
    "/api/proposals": ["projects.read"],
    "/api/metrics": ["analytics.read"],
    "/api/mcp": ["mcp.access"],
    "/api/self-improvement": ["admin"]
}

class AuthMiddleware:
    """JWT Authentication Middleware"""
    
    def __init__(self):
        self.security = HTTPBearer(auto_error=False)
    
    async def __call__(self, request: Request, call_next):
        """Process authentication for each request"""
        
        # Skip authentication for public routes
        if self._is_public_route(request.url.path):
            response = await call_next(request)
            return response
        
        # Extract token from Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            await debug("AUTH_MIDDLEWARE", f"No valid auth header for {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authorization header",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        token = authorization.replace("Bearer ", "")
        
        # Verify token
        user = await auth_system.verify_token(token)
        if not user:
            await debug("AUTH_MIDDLEWARE", f"Invalid token for {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check route-specific permissions
        if not await self._check_route_permissions(request.url.path, user):
            await debug("AUTH_MIDDLEWARE", f"Permission denied for {user['email']} to {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this resource"
            )
        
        # Attach user to request state
        request.state.user = user
        
        # Process request
        response = await call_next(request)
        return response
    
    def _is_public_route(self, path: str) -> bool:
        """Check if route is public"""
        for public_route in PUBLIC_ROUTES:
            if path == public_route or path.startswith(f"{public_route}/"):
                return True
        return False
    
    async def _check_route_permissions(self, path: str, user: dict) -> bool:
        """Check if user has permission to access route"""
        
        # Master admin has access to everything
        if user.get("role") == "master_admin":
            return True
        
        # Check specific route permissions
        for route_prefix, required_permissions in PERMISSION_MAP.items():
            if path.startswith(route_prefix):
                user_permissions = await auth_system.get_user_permissions(user["email"])
                
                # Check if user has any of the required permissions
                for permission in required_permissions:
                    if permission in user_permissions["permissions"] or "*" in user_permissions["permissions"]:
                        return True
                
                return False
        
        # Default: allow authenticated users to access unspecified routes
        return True

# Create middleware instance
auth_middleware = AuthMiddleware()