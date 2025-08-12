"""
Sunny Secure Authentication System
Multi-layer security with master admin access and role-based control
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, List, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets
import json
from pathlib import Path
import os
from dotenv import load_dotenv
from ..utils.debug_helper import debug

# Load environment variables
load_dotenv()

# Security Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
MFA_CODE_EXPIRE_MINUTES = 5

# Debug logging
print(f"[AUTH_SYSTEM.PY] JWT_SECRET_KEY loaded: {SECRET_KEY[:20]}..." if len(SECRET_KEY) > 20 else f"[AUTH_SYSTEM.PY] JWT_SECRET_KEY: {SECRET_KEY}")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User roles and permissions
class UserRole:
    MASTER_ADMIN = "master_admin"  # Luka's role
    ADMIN = "admin"
    CLIENT_DEMO = "client_demo"
    TESTER = "tester"
    PROSPECT = "prospect"
    READONLY = "readonly"

# Application access mapping
APP_ACCESS = {
    UserRole.MASTER_ADMIN: ["*"],  # Access to everything
    UserRole.ADMIN: ["sunny", "navigatorcore", "admin_panel"],
    UserRole.CLIENT_DEMO: ["client_app", "demo_features"],
    UserRole.TESTER: ["test_environment", "debug_tools"],
    UserRole.PROSPECT: ["landing", "demo_preview"],
    UserRole.READONLY: ["public_content"]
}

class SecureAuthSystem:
    """
    Comprehensive authentication system for Sunny platform
    """
    
    def __init__(self):
        # Use absolute paths to ensure database is found regardless of where backend is run from
        # Backend runs from C:\Sunny\backend, but data is in C:\Sunny\data
        base_path = Path(__file__).parent.parent.parent.parent  # Go up to C:\Sunny
        print(f"[AUTH_SYSTEM] Base path resolved to: {base_path}")
        
        self.users_db_path = base_path / "data" / "users.json"
        self.sessions_db_path = base_path / "data" / "sessions.json"
        self.audit_log_path = base_path / "data" / "auth_audit.json"
        
        print(f"[AUTH_SYSTEM] Users database path: {self.users_db_path}")
        print(f"[AUTH_SYSTEM] Database exists: {self.users_db_path.exists()}")
        
        # Initialize master admin account
        self._initialize_master_admin()
        
        # Load users database - ALWAYS reload from disk
        self.users = self._load_users()
        print(f"[AUTH_SYSTEM] Loaded users on init: {list(self.users.keys())}")
        self.sessions = {}
        self.mfa_codes = {}
        
    def _initialize_master_admin(self):
        """Initialize master admin account for Luka"""
        if not self.users_db_path.exists():
            self.users_db_path.parent.mkdir(parents=True, exist_ok=True)
            
            master_admin = {
                "luka@sunny-stack.com": {
                    "email": "luka@sunny-stack.com",
                    "password_hash": self.hash_password("SunnyMaster2024!"),  # Change this immediately
                    "role": UserRole.MASTER_ADMIN,
                    "name": "Luka Frederiksen",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "is_active": True,
                    "mfa_enabled": True,
                    "mfa_secret": secrets.token_urlsafe(32),
                    "app_access": ["*"],
                    "metadata": {
                        "is_founder": True,
                        "company": "Sunny Stack"
                    }
                }
            }
            
            with open(self.users_db_path, 'w') as f:
                json.dump(master_admin, f, indent=2)
            
            debug("AUTH", "Master admin account initialized for luka@sunny-stack.com")
    
    def _load_users(self) -> Dict:
        """Load users from database"""
        print(f"[AUTH_SYSTEM] Loading users from: {self.users_db_path}")
        if self.users_db_path.exists():
            try:
                with open(self.users_db_path, 'r') as f:
                    users = json.load(f)
                    print(f"[AUTH_SYSTEM] Loaded {len(users)} users from database")
                    print(f"[AUTH_SYSTEM] Users in database: {list(users.keys())}")
                    return users
            except Exception as e:
                print(f"[ERROR] [AUTH_SYSTEM] Error loading users database: {e}")
                return {}
        else:
            print(f"[WARNING] [AUTH_SYSTEM] Users database not found at: {self.users_db_path}")
        return {}
    
    def _save_users(self):
        """Save users to database"""
        with open(self.users_db_path, 'w') as f:
            json.dump(self.users, f, indent=2)
    
    def hash_password(self, password: str) -> str:
        """Hash a password for storing"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against hash"""
        try:
            print(f"[AUTH_SYSTEM] Verifying password...")
            print(f"[AUTH_SYSTEM] Password type: {type(plain_password)}, Hash type: {type(hashed_password)}")
            
            # Ensure password is string and encode properly
            if isinstance(plain_password, bytes):
                plain_password = plain_password.decode('utf-8')
            
            # Verify using passlib
            result = pwd_context.verify(plain_password, hashed_password)
            print(f"[AUTH_SYSTEM] Password verification result: {result}")
            return result
            
        except Exception as e:
            print(f"[ERROR] [AUTH_SYSTEM] Password verification error: {e}")
            print(f"[AUTH_SYSTEM] Error type: {type(e)}")
            import traceback
            print(f"[AUTH_SYSTEM] Stack trace: {traceback.format_exc()}")
            return False
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def create_refresh_token(self, data: dict):
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate a user"""
        try:
            print(f"[INFO] [AUTH_SYSTEM] Authentication attempt for: {email}")
            print(f"[DATA] [AUTH_SYSTEM] Current users in memory: {list(self.users.keys())}")
            print(f"[TARGET] [AUTH_SYSTEM] Total users loaded: {len(self.users)}")
            
            # Ensure email is string
            email = str(email).lower().strip()
            print(f"[EMAIL] [AUTH_SYSTEM] Normalized email: {email}")
            
            debug("AUTH", f"Authentication attempt for {email}")
            
            # Try to get user from memory
            user = self.users.get(email)
            if not user:
                # Try reloading users from disk in case the database was updated
                print(f"[AUTH_SYSTEM] User not found in memory, reloading from disk...")
                try:
                    self.users = self._load_users()
                    user = self.users.get(email)
                except Exception as load_error:
                    print(f"[ERROR] [AUTH_SYSTEM] Error reloading users: {load_error}")
                    return None
                
                if not user:
                    print(f"[ERROR] [AUTH_SYSTEM] User not found in database: {email}")
                    print(f"[DEBUG] [AUTH_SYSTEM] Available users: {list(self.users.keys())}")
                    debug("AUTH", f"User not found: {email}")
                    try:
                        await self._audit_log("login_failed", {"email": email, "reason": "user_not_found"})
                    except:
                        pass  # Don't fail auth due to audit log error
                    return None
            
            print(f" [AUTH_SYSTEM] User found in database: {email}")
            print(f"[DATA] [AUTH_SYSTEM] User data keys: {list(user.keys())}")
            
            # Verify password with error handling
            try:
                password_hash = user.get("password_hash")
                if not password_hash:
                    print(f"[ERROR] [AUTH_SYSTEM] No password hash found for user: {email}")
                    return None
                
                if not self.verify_password(password, password_hash):
                    print(f"[ERROR] [AUTH_SYSTEM] Invalid password for: {email}")
                    debug("AUTH", f"Invalid password for {email}")
                    try:
                        await self._audit_log("login_failed", {"email": email, "reason": "invalid_password"})
                    except:
                        pass  # Don't fail auth due to audit log error
                    return None
                    
            except Exception as pwd_error:
                print(f"[ERROR] [AUTH_SYSTEM] Password verification exception: {pwd_error}")
                return None
            
            print(f" [AUTH_SYSTEM] Password verified for: {email}")
            
            # Check if user is active
            if not user.get("is_active", True):
                print(f"[ERROR] [AUTH_SYSTEM] Inactive user attempted login: {email}")
                debug("AUTH", f"Inactive user attempted login: {email}")
                try:
                    await self._audit_log("login_failed", {"email": email, "reason": "account_inactive"})
                except:
                    pass
                return None
            
            # Check expiration for temporary users
            if user.get("expires_at"):
                try:
                    expiry = datetime.fromisoformat(user["expires_at"])
                    if datetime.now(timezone.utc) > expiry:
                        print(f"[ERROR] [AUTH_SYSTEM] Expired user attempted login: {email}")
                        debug("AUTH", f"Expired user attempted login: {email}")
                        try:
                            await self._audit_log("login_failed", {"email": email, "reason": "account_expired"})
                        except:
                            pass
                        return None
                except Exception as date_error:
                    print(f"[WARNING] [AUTH_SYSTEM] Error checking expiration: {date_error}")
                    # Continue if date parsing fails
            
            print(f" [AUTH_SYSTEM] All checks passed for: {email}")
            debug("AUTH", f"Successful authentication for {email}")
            
            try:
                await self._audit_log("login_success", {"email": email, "role": user.get("role", "unknown")})
            except:
                pass  # Don't fail auth due to audit log error
            
            return user
            
        except Exception as e:
            print(f"[ERROR] [AUTH_SYSTEM] Authentication error: {e}")
            print(f"[DEBUG] [AUTH_SYSTEM] Error type: {type(e)}")
            import traceback
            print(f"[TRACE] [AUTH_SYSTEM] Stack trace: {traceback.format_exc()}")
            return None
    
    async def generate_mfa_code(self, email: str) -> str:
        """Generate MFA code for user"""
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        self.mfa_codes[email] = {
            "code": code,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=MFA_CODE_EXPIRE_MINUTES)
        }
        
        debug("AUTH", f"MFA code generated for {email}")
        # In production, send this via email/SMS
        return code
    
    async def verify_mfa_code(self, email: str, code: str) -> bool:
        """Verify MFA code"""
        stored = self.mfa_codes.get(email)
        if not stored:
            return False
        
        if datetime.now(timezone.utc) > stored["expires_at"]:
            del self.mfa_codes[email]
            return False
        
        if stored["code"] == code:
            del self.mfa_codes[email]
            debug("AUTH", f"MFA verification successful for {email}")
            return True
        
        return False
    
    async def create_temporary_user(
        self,
        email: str,
        name: str,
        role: str,
        app_access: List[str],
        expires_in_hours: int = 24,
        created_by: str = None
    ) -> Dict:
        """Create a temporary user account"""
        
        # Generate temporary password
        temp_password = secrets.token_urlsafe(12)
        
        # Calculate expiration
        expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
        
        # Create user
        user_data = {
            "email": email,
            "password_hash": self.hash_password(temp_password),
            "role": role,
            "name": name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat(),
            "is_active": True,
            "mfa_enabled": False,
            "app_access": app_access,
            "created_by": created_by,
            "is_temporary": True,
            "metadata": {
                "temp_password": temp_password,  # Store temporarily for display
                "login_url": f"https://sunny-stack.com/login?email={email}"
            }
        }
        
        # Save user
        self.users[email] = user_data
        self._save_users()
        
        debug("AUTH", f"Temporary user created: {email} by {created_by}")
        await self._audit_log("temp_user_created", {
            "email": email,
            "role": role,
            "created_by": created_by,
            "expires_at": expires_at.isoformat()
        })
        
        return {
            "email": email,
            "temporary_password": temp_password,
            "expires_at": expires_at.isoformat(),
            "login_url": user_data["metadata"]["login_url"]
        }
    
    async def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return user data"""
        try:
            print(f"[AUTH_SYSTEM] Verifying token with SECRET_KEY: {SECRET_KEY[:20]}...")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"[AUTH_SYSTEM] Token payload decoded: {payload}")
            email: str = payload.get("sub")
            
            if email is None:
                print(f"[AUTH_SYSTEM] No 'sub' claim in token payload")
                return None
            
            print(f"[AUTH_SYSTEM] Looking for user: {email}")
            user = self.users.get(email)
            if not user:
                # Try reloading users from disk in case the database was updated
                print(f"[AUTH_SYSTEM] User not found in memory, reloading from disk...")
                self.users = self._load_users()
                user = self.users.get(email)
                
                if not user:
                    print(f"[AUTH_SYSTEM] User not found in database: {email}")
                    print(f"[AUTH_SYSTEM] Available users: {list(self.users.keys())}")
                    return None
            
            # Check if user is still active
            if not user.get("is_active", True):
                return None
            
            # Check expiration for temporary users
            if user.get("expires_at"):
                expiry = datetime.fromisoformat(user["expires_at"])
                if datetime.now(timezone.utc) > expiry:
                    return None
            
            return user
            
        except JWTError as e:
            debug("AUTH", f"Token verification failed: {str(e)}")
            return None
    
    async def get_user_permissions(self, email: str) -> Dict:
        """Get user permissions and access rights"""
        user = self.users.get(email)
        if not user:
            return {"apps": [], "permissions": []}
        
        role = user.get("role", UserRole.READONLY)
        
        # Master admin has everything
        if role == UserRole.MASTER_ADMIN:
            return {
                "apps": ["*"],
                "permissions": ["*"],
                "is_master": True
            }
        
        # Get app access
        app_access = user.get("app_access", APP_ACCESS.get(role, []))
        
        # Get role-based permissions
        permissions = self._get_role_permissions(role)
        
        return {
            "apps": app_access,
            "permissions": permissions,
            "is_master": False
        }
    
    def _get_role_permissions(self, role: str) -> List[str]:
        """Get permissions for a role"""
        permissions_map = {
            UserRole.ADMIN: [
                "users.create", "users.read", "users.update",
                "projects.create", "projects.read", "projects.update", "projects.delete",
                "analytics.read", "settings.update"
            ],
            UserRole.CLIENT_DEMO: [
                "projects.read", "analytics.read", "demo.access"
            ],
            UserRole.TESTER: [
                "projects.read", "test.access", "debug.access"
            ],
            UserRole.PROSPECT: [
                "demo.preview", "public.read"
            ],
            UserRole.READONLY: [
                "public.read"
            ]
        }
        
        return permissions_map.get(role, [])
    
    async def update_user(self, email: str, updates: Dict) -> bool:
        """Update user information"""
        if email not in self.users:
            return False
        
        # Don't allow updating certain fields
        protected_fields = ["email", "password_hash", "created_at"]
        for field in protected_fields:
            updates.pop(field, None)
        
        # Update user
        self.users[email].update(updates)
        self._save_users()
        
        debug("AUTH", f"User updated: {email}")
        await self._audit_log("user_updated", {"email": email, "updates": list(updates.keys())})
        
        return True
    
    async def deactivate_user(self, email: str, deactivated_by: str) -> bool:
        """Deactivate a user account"""
        if email not in self.users:
            return False
        
        # Don't allow deactivating master admin
        if self.users[email].get("role") == UserRole.MASTER_ADMIN:
            debug("AUTH", f"Attempted to deactivate master admin: {email}")
            return False
        
        self.users[email]["is_active"] = False
        self.users[email]["deactivated_at"] = datetime.now(timezone.utc).isoformat()
        self.users[email]["deactivated_by"] = deactivated_by
        self._save_users()
        
        debug("AUTH", f"User deactivated: {email} by {deactivated_by}")
        await self._audit_log("user_deactivated", {
            "email": email,
            "deactivated_by": deactivated_by
        })
        
        return True
    
    async def list_users(self, include_inactive: bool = False) -> List[Dict]:
        """List all users"""
        users_list = []
        
        for email, user in self.users.items():
            if not include_inactive and not user.get("is_active", True):
                continue
            
            # Don't include sensitive data
            user_info = {
                "email": email,
                "name": user.get("name"),
                "role": user.get("role"),
                "is_active": user.get("is_active", True),
                "created_at": user.get("created_at"),
                "expires_at": user.get("expires_at"),
                "is_temporary": user.get("is_temporary", False),
                "app_access": user.get("app_access", [])
            }
            users_list.append(user_info)
        
        return users_list
    
    async def _audit_log(self, event_type: str, details: Dict):
        """Log authentication events for audit"""
        try:
            if not self.audit_log_path.exists():
                self.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.audit_log_path, 'w') as f:
                    json.dump([], f)
            
            # Load existing logs
            with open(self.audit_log_path, 'r') as f:
                logs = json.load(f)
            
            # Add new log entry
            log_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": event_type,
                "details": details
            }
            logs.append(log_entry)
            
            # Keep only last 10000 entries
            if len(logs) > 10000:
                logs = logs[-10000:]
            
            # Save logs
            with open(self.audit_log_path, 'w') as f:
                json.dump(logs, f, indent=2)
                
        except Exception as e:
            print(f"[WARNING] [AUTH_SYSTEM] Audit log error (non-critical): {e}")
            # Don't fail the operation due to audit log errors
    
    async def get_audit_logs(self, limit: int = 100) -> List[Dict]:
        """Get recent audit logs"""
        if not self.audit_log_path.exists():
            return []
        
        with open(self.audit_log_path, 'r') as f:
            logs = json.load(f)
        
        return logs[-limit:]

# Global instance
auth_system = SecureAuthSystem()