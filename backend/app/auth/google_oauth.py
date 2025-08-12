"""
Google OAuth integration for Claude.ai MCP connector
Uses existing Google credentials to authenticate MCP access
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse, JSONResponse
import json
import os
from datetime import datetime, timedelta
import jwt
from typing import Optional
import secrets
import urllib.parse

router = APIRouter()

# 🔧 Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")  
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = "https://sunny-stack.com/api/oauth/google/callback"

# Scopes that Claude.ai typically requests
OAUTH_SCOPES = [
    'openid',
    'email', 
    'profile'
]

# In-memory session storage (upgrade to Redis in production)
oauth_sessions = {}
mcp_tokens = {}

def log_oauth(message: str, **kwargs):
    """OAuth-specific debug logging"""
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] OAUTH: {message}")
    if kwargs:
        print(f"    Details: {kwargs}")

@router.get("/authorize")
async def oauth_authorize(
    client_id: Optional[str] = None,
    redirect_uri: Optional[str] = None,
    scope: Optional[str] = None,
    state: Optional[str] = None,
    response_type: Optional[str] = None
):
    """🔐 OAuth authorization endpoint for Claude.ai MCP connector"""
    
    log_oauth("Authorization request received", 
             client_id=client_id,
             redirect_uri=redirect_uri, 
             scope=scope,
             response_type=response_type)
    
    try:
        # For simplified OAuth flow, we'll redirect to Google OAuth directly
        google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        
        # Generate a secure state token
        oauth_state = secrets.token_urlsafe(32)
        
        # Store session info
        oauth_sessions[oauth_state] = {
            'client_id': client_id,
            'redirect_uri': redirect_uri or 'https://claude.ai',
            'claude_state': state,
            'timestamp': datetime.now().isoformat()
        }
        
        # Build Google OAuth URL
        params = {
            'client_id': GOOGLE_CLIENT_ID,
            'redirect_uri': GOOGLE_REDIRECT_URI,
            'response_type': 'code',
            'scope': ' '.join(OAUTH_SCOPES),
            'state': oauth_state,
            'access_type': 'offline',
            'include_granted_scopes': 'true'
        }
        
        authorization_url = f"{google_auth_url}?{urllib.parse.urlencode(params)}"
        
        log_oauth("Redirecting to Google OAuth", 
                 authorization_url=authorization_url,
                 oauth_state=oauth_state)
        
        return RedirectResponse(url=authorization_url)
        
    except Exception as e:
        log_oauth(f"Authorization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OAuth authorization failed: {str(e)}")

@router.get("/callback")
async def oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    request: Request = None
):
    """🔐 OAuth callback handler - processes Google OAuth response"""
    
    log_oauth("OAuth callback received", 
             has_code=bool(code), 
             state=state,
             error=error)
    
    if error:
        log_oauth(f"OAuth error: {error}")
        return JSONResponse(
            status_code=400,
            content={"error": error, "message": "OAuth authorization denied"}
        )
    
    try:
        # Retrieve session
        if state not in oauth_sessions:
            log_oauth("Invalid OAuth state", state=state)
            raise HTTPException(status_code=400, detail="Invalid OAuth state")
        
        session = oauth_sessions[state]
        
        # For simplified flow, we'll generate an MCP token directly
        # In production, you'd exchange the code with Google for tokens
        
        # Generate MCP access token
        mcp_access_token = generate_mcp_token({
            'sub': 'google_user_' + secrets.token_hex(8),
            'email': 'user@example.com',  # Would come from Google
            'name': 'Authenticated User'
        })
        
        # Store token for MCP access
        mcp_tokens[mcp_access_token] = {
            'user_id': 'google_user_' + secrets.token_hex(8),
            'email': 'user@example.com',
            'name': 'Authenticated User',
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        log_oauth("Token generated successfully", 
                 token=mcp_access_token[:20] + "...")
        
        # Redirect back to Claude with access token
        claude_redirect = session.get('redirect_uri', 'https://claude.ai')
        claude_state = session.get('claude_state', '')
        
        # Build redirect URL with code
        params = {
            'code': mcp_access_token
        }
        if claude_state:
            params['state'] = claude_state
            
        redirect_url = f"{claude_redirect}?{urllib.parse.urlencode(params)}"
        
        # Cleanup session
        del oauth_sessions[state]
        
        log_oauth("Redirecting back to Claude", redirect_url=redirect_url)
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        log_oauth(f"OAuth callback failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")

@router.post("/token")
async def oauth_token(
    request: Request
):
    """🔐 OAuth token exchange endpoint"""
    
    try:
        # Parse form data
        form_data = await request.form()
        grant_type = form_data.get("grant_type")
        code = form_data.get("code")
        refresh_token = form_data.get("refresh_token")
        client_id = form_data.get("client_id")
        client_secret = form_data.get("client_secret")
        
        log_oauth("Token exchange request", 
                 grant_type=grant_type,
                 has_code=bool(code),
                 has_refresh_token=bool(refresh_token))
        
        if grant_type == "authorization_code" and code:
            # Code should be our MCP access token from callback
            if code in mcp_tokens:
                token_data = mcp_tokens[code]
                
                response = {
                    "access_token": code,
                    "token_type": "Bearer",
                    "expires_in": 86400,  # 24 hours
                    "scope": "mcp_access",
                    "user_info": {
                        "id": token_data['user_id'],
                        "email": token_data['email'],
                        "name": token_data['name']
                    }
                }
                
                log_oauth("Token exchange successful", user_email=token_data['email'])
                return response
            else:
                log_oauth("Invalid authorization code", code=code[:20] + "..." if code else "")
                raise HTTPException(status_code=400, detail="Invalid authorization code")
        
        elif grant_type == "refresh_token" and refresh_token:
            # Handle refresh token flow
            if refresh_token in mcp_tokens:
                # In production, implement proper refresh logic
                token_data = mcp_tokens[refresh_token]
                
                # Extend expiration
                token_data['expires_at'] = (datetime.now() + timedelta(hours=24)).isoformat()
                
                response = {
                    "access_token": refresh_token,
                    "token_type": "Bearer", 
                    "expires_in": 86400,
                    "scope": "mcp_access"
                }
                
                log_oauth("Token refresh successful")
                return response
            else:
                raise HTTPException(status_code=400, detail="Invalid refresh token")
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported grant type")
            
    except Exception as e:
        log_oauth(f"Token exchange failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")

def generate_mcp_token(user_info: dict) -> str:
    """Generate MCP access token"""
    payload = {
        'sub': user_info.get('sub', 'unknown'),
        'email': user_info.get('email', 'unknown@example.com'),
        'name': user_info.get('name', 'Unknown User'),
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=24),
        'scope': 'mcp_access'
    }
    
    # Use your JWT secret
    secret = os.getenv("JWT_SECRET_KEY", "sunny-mcp-secret-key-2024")
    token = jwt.encode(payload, secret, algorithm="HS256")
    
    return token

def verify_mcp_token(token: str) -> Optional[dict]:
    """Verify MCP access token"""
    try:
        if token in mcp_tokens:
            token_data = mcp_tokens[token]
            
            # Check expiration
            expires_at = datetime.fromisoformat(token_data['expires_at'])
            if datetime.now() > expires_at:
                del mcp_tokens[token]
                return None
            
            return token_data
        
        # Also try to decode JWT tokens
        try:
            secret = os.getenv("JWT_SECRET_KEY", "sunny-mcp-secret-key-2024")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            
            # Create token data from JWT payload
            return {
                'user_id': payload.get('sub'),
                'email': payload.get('email'),
                'name': payload.get('name'),
                'created_at': datetime.fromtimestamp(payload.get('iat', 0)).isoformat(),
                'expires_at': datetime.fromtimestamp(payload.get('exp', 0)).isoformat()
            }
        except jwt.InvalidTokenError:
            pass
        
        return None
        
    except Exception as e:
        log_oauth(f"Token verification failed: {str(e)}")
        return None

@router.get("/userinfo")
async def get_user_info(request: Request):
    """🔐 Get user information for authenticated MCP requests"""
    
    # Extract Bearer token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split("Bearer ")[1]
    token_data = verify_mcp_token(token)
    
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "id": token_data['user_id'],
        "email": token_data['email'],
        "name": token_data['name'],
        "verified_email": True
    }

@router.get("/test")
async def test_oauth():
    """Test OAuth endpoint"""
    return {
        "status": "operational",
        "oauth_provider": "Google OAuth",
        "endpoints": {
            "authorize": "/api/oauth/google/authorize",
            "callback": "/api/oauth/google/callback",
            "token": "/api/oauth/google/token",
            "userinfo": "/api/oauth/google/userinfo"
        },
        "google_client_configured": bool(GOOGLE_CLIENT_ID),
        "sessions_active": len(oauth_sessions),
        "tokens_active": len(mcp_tokens)
    }