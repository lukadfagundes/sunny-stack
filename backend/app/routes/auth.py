from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import jwt
import bcrypt
import secrets
import time
from typing import Dict, Optional
from datetime import datetime, timedelta
import os
from pathlib import Path
from dotenv import load_dotenv, set_key

load_dotenv()

router = APIRouter()
security = HTTPBearer()

reset_codes: Dict[str, Dict] = {}

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRATION_HOURS = 24

# Debug logging
print(f"[AUTH.PY] JWT_SECRET_KEY loaded: {SECRET_KEY[:20]}..." if len(SECRET_KEY) > 20 else f"[AUTH.PY] JWT_SECRET_KEY: {SECRET_KEY}")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ResetRequest(BaseModel):
    email: EmailStr

class VerifyResetRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    newPassword: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    print(f"[AUTH.PY] Creating token with SECRET_KEY: {SECRET_KEY[:20]}...")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        print(f"[AUTH.PY] Verifying token with SECRET_KEY: {SECRET_KEY[:20]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError as e:
        print(f"[AUTH.PY] JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login")
async def login(request: LoginRequest):
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "luka@sunny-stack.com")
        admin_password = "S@m3fweak"  # Direct password for now
        
        print(f"Login attempt for: {request.email}")
        print(f"Expected email: {admin_email}")
        
        if request.email != admin_email:
            print(f"Email mismatch: {request.email} != {admin_email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if request.password != admin_password:
            print(f"Password mismatch for {request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        print(f"Login successful for {request.email}")
        # Use "sub" claim for JWT standard compliance
        access_token = create_access_token({"sub": request.email, "email": request.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@router.get("/verify")
async def verify_auth(payload=Depends(verify_token)):
    return {"valid": True, "email": payload.get("email")}

@router.post("/request-reset")
async def request_password_reset(request: ResetRequest):
    admin_email = os.getenv("ADMIN_EMAIL", "luka@sunny-stack.com")
    
    if request.email != admin_email:
        raise HTTPException(status_code=404, detail="User not found")
    
    code = str(secrets.randbelow(900000) + 100000)
    
    reset_codes[request.email] = {
        "code": code,
        "expires": time.time() + 600
    }
    
    print(f"\n🔑 PASSWORD RESET CODE FOR {request.email}: {code}")
    print(f"   Code expires in 10 minutes\n")
    
    os.makedirs("logs", exist_ok=True)
    with open("logs/password_reset.log", "a") as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - Reset code for {request.email}: {code}\n")
    
    return {"message": "Reset code generated - check console/logs"}

@router.post("/verify-reset")
async def verify_reset_code(request: VerifyResetRequest):
    if request.email not in reset_codes:
        raise HTTPException(status_code=400, detail="No reset request found")
    
    stored_data = reset_codes[request.email]
    
    if time.time() > stored_data["expires"]:
        del reset_codes[request.email]
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    if stored_data["code"] != request.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    return {"message": "Code verified"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    if request.email not in reset_codes or reset_codes[request.email]["code"] != request.code:
        raise HTTPException(status_code=400, detail="Invalid reset request")
    
    if time.time() > reset_codes[request.email]["expires"]:
        del reset_codes[request.email]
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    password_hash = bcrypt.hashpw(request.newPassword.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    env_file = Path(".env")
    
    if env_file.exists():
        set_key(env_file, "ADMIN_PASSWORD_HASH", password_hash)
    else:
        with open(env_file, "w") as f:
            f.write(f"ADMIN_PASSWORD_HASH={password_hash}\n")
    
    del reset_codes[request.email]
    
    print(f"✅ Password reset successful for {request.email}")
    
    return {"message": "Password reset successful"}

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout endpoint - Since JWT is stateless, we return success.
    The client should remove the token from storage.
    """
    # In a production environment, you might want to:
    # 1. Add the token to a blacklist
    # 2. Track logout events for audit
    # 3. Clear any server-side session data
    
    # For now, we just acknowledge the logout
    print(f"🚪 LOGOUT: User signed out successfully")
    return {"message": "Logged out successfully"}