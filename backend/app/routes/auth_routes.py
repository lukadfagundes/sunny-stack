"""
Authentication API Routes
Secure login, user management, and token handling
"""

from fastapi import APIRouter, HTTPException, Depends, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime, timedelta, timezone

from ..auth.auth_system import auth_system, UserRole
from ..utils.debug_helper import debug

router = APIRouter()
security = HTTPBearer()

# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict
    requires_mfa: bool = False

class CreateTempUserRequest(BaseModel):
    email: EmailStr
    name: str
    role: str
    app_access: List[str]
    expires_in_hours: int = 24

class TempUserResponse(BaseModel):
    email: str
    temporary_password: str
    expires_at: str
    login_url: str

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    app_access: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from token"""
    token = credentials.credentials
    user = await auth_system.verify_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# Dependency to require admin access
async def require_admin(current_user: Dict = Depends(get_current_user)):
    """Require admin or master_admin role"""
    if current_user.get("role") not in [UserRole.ADMIN, UserRole.MASTER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Dependency to require master admin access
async def require_master_admin(current_user: Dict = Depends(get_current_user)):
    """Require master_admin role (Luka only)"""
    if current_user.get("role") != UserRole.MASTER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Master admin access required"
        )
    return current_user

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return tokens"""
    await debug("AUTH_API", f"Login attempt for {request.email}")
    
    # Authenticate user
    user = await auth_system.authenticate_user(request.email, request.password)
    
    if not user:
        await debug("AUTH_API", f"Login failed for {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if MFA is required
    if user.get("mfa_enabled", False):
        if not request.mfa_code:
            # Generate and send MFA code
            mfa_code = await auth_system.generate_mfa_code(request.email)
            await debug("AUTH_API", f"MFA required for {request.email}, code: {mfa_code}")
            
            return LoginResponse(
                access_token="",
                refresh_token="",
                user={"email": request.email},
                requires_mfa=True
            )
        
        # Verify MFA code
        if not await auth_system.verify_mfa_code(request.email, request.mfa_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code"
            )
    
    # Create tokens
    access_token = auth_system.create_access_token(data={"sub": user["email"]})
    refresh_token = auth_system.create_refresh_token(data={"sub": user["email"]})
    
    # Get user permissions
    permissions = await auth_system.get_user_permissions(user["email"])
    
    # Prepare user data (without sensitive info)
    user_data = {
        "email": user["email"],
        "name": user.get("name"),
        "role": user.get("role"),
        "app_access": permissions["apps"],
        "permissions": permissions["permissions"],
        "is_master": permissions.get("is_master", False),
        "is_temporary": user.get("is_temporary", False),
        "expires_at": user.get("expires_at")
    }
    
    await debug("AUTH_API", f"Login successful for {request.email}")
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_data,
        requires_mfa=False
    )

@router.post("/refresh")
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh access token using refresh token"""
    token = credentials.credentials
    
    try:
        # Verify refresh token
        user = await auth_system.verify_token(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new access token
        access_token = auth_system.create_access_token(data={"sub": user["email"]})
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        await debug("ERROR", f"Token refresh failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh token"
        )

@router.get("/me")
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """Get current user information"""
    permissions = await auth_system.get_user_permissions(current_user["email"])
    
    return {
        "email": current_user["email"],
        "name": current_user.get("name"),
        "role": current_user.get("role"),
        "app_access": permissions["apps"],
        "permissions": permissions["permissions"],
        "is_master": permissions.get("is_master", False),
        "is_temporary": current_user.get("is_temporary", False),
        "expires_at": current_user.get("expires_at")
    }

@router.post("/logout")
async def logout(response: Response, current_user: Dict = Depends(get_current_user)):
    """Logout user (client should discard tokens)"""
    await debug("AUTH_API", f"User logged out: {current_user['email']}")
    
    # In a production system, you might want to blacklist the token here
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    
    return {"message": "Successfully logged out"}

@router.post("/create-temp-user", response_model=TempUserResponse)
async def create_temporary_user(
    request: CreateTempUserRequest,
    admin_user: Dict = Depends(require_admin)
):
    """Create a temporary user account (Admin only)"""
    await debug("AUTH_API", f"Creating temp user {request.email} by {admin_user['email']}")
    
    # Validate role
    valid_roles = [UserRole.CLIENT_DEMO, UserRole.TESTER, UserRole.PROSPECT, UserRole.READONLY]
    if request.role not in valid_roles and admin_user.get("role") != UserRole.MASTER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {valid_roles}"
        )
    
    # Create temporary user
    result = await auth_system.create_temporary_user(
        email=request.email,
        name=request.name,
        role=request.role,
        app_access=request.app_access,
        expires_in_hours=request.expires_in_hours,
        created_by=admin_user["email"]
    )
    
    return TempUserResponse(**result)

@router.get("/users")
async def list_users(
    include_inactive: bool = False,
    admin_user: Dict = Depends(require_admin)
):
    """List all users (Admin only)"""
    users = await auth_system.list_users(include_inactive=include_inactive)
    return {"users": users, "total": len(users)}

@router.put("/users/{email}")
async def update_user(
    email: str,
    request: UserUpdateRequest,
    admin_user: Dict = Depends(require_admin)
):
    """Update user information (Admin only)"""
    # Only master admin can update other admins
    target_user = auth_system.users.get(email)
    if target_user and target_user.get("role") == UserRole.ADMIN:
        if admin_user.get("role") != UserRole.MASTER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only master admin can update other admins"
            )
    
    updates = request.dict(exclude_unset=True)
    success = await auth_system.update_user(email, updates)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User updated successfully"}

@router.delete("/users/{email}")
async def deactivate_user(
    email: str,
    admin_user: Dict = Depends(require_admin)
):
    """Deactivate a user account (Admin only)"""
    success = await auth_system.deactivate_user(email, admin_user["email"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not deactivate user"
        )
    
    return {"message": "User deactivated successfully"}

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    master_admin: Dict = Depends(require_master_admin)
):
    """Get authentication audit logs (Master Admin only)"""
    logs = await auth_system.get_audit_logs(limit=limit)
    return {"logs": logs, "total": len(logs)}

@router.post("/verify-token")
async def verify_token(current_user: Dict = Depends(get_current_user)):
    """Verify if token is valid"""
    return {"valid": True, "email": current_user["email"]}

# Health check endpoint (no auth required)
@router.get("/health")
async def auth_health():
    """Check auth service health"""
    return {"status": "healthy", "service": "authentication"}