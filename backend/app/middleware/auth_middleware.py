"""
Authentication Middleware
Protects API routes with JWT authentication
"""

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from typing import Optional, List

from ..auth.auth_system import auth_system
from ..utils.debug_helper import debug

# Routes that don't require authentication - STRICT LIST
PUBLIC_ROUTES = [
    "/",
    "/health",
    "/api/health",  # Add API health endpoint
    "/api/auth/login",
    "/api/auth/request-reset",  # Allow password reset
    "/api/auth/verify-reset",   # Allow password reset verification
    "/api/auth/reset-password",  # Allow password setting
    "/api/auth/health",
    # Remove docs in production for security
    # "/docs",
    # "/openapi.json",
    # "/redoc",
]

# Routes that require specific permissions
PERMISSION_MAP = {
    "/api/projects": ["projects.read"],
    "/api/analysis": ["analytics.read"],
    "/api/proposals": ["projects.read"],
    "/api/metrics": ["analytics.read"],
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
        
        # SPECIAL HANDLING: Auth verify endpoints handle their own validation
        # The verify endpoints need to receive the token to validate it themselves
        if request.url.path in ["/api/auth/verify", "/api/auth/verify-token"]:
            response = await call_next(request)
            return response
        
        # Extract token from Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            debug("AUTH_MIDDLEWARE", f"No valid auth header for {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing or invalid authorization header"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        token = authorization.replace("Bearer ", "")
        
        # Verify token
        user = await auth_system.verify_token(token)
        if not user:
            debug("AUTH_MIDDLEWARE", f"Invalid token for {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or expired token"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check route-specific permissions
        if not await self._check_route_permissions(request.url.path, user):
            debug("AUTH_MIDDLEWARE", f"Permission denied for {user['email']} to {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Insufficient permissions for this resource"}
            )
        
        # Attach user to request state
        request.state.user = user
        
        # Process request
        response = await call_next(request)
        return response
    
    def _is_public_route(self, path: str) -> bool:
        """Check if route is public"""
        # Check explicit public routes
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