"""
API Key Management System for MCP Authentication
Handles generation, validation, and management of API keys for external MCP clients
"""

import secrets
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional, List, Any
from ..utils.debug_helper import debug

class APIKeyManager:
    """Manages API keys for MCP authentication"""
    
    def __init__(self):
        self.keys_file = Path("backend/.api_keys.json")
        self.keys_file.parent.mkdir(exist_ok=True)
        self.keys = self._load_keys()
        self.access_log = []
        
    def _load_keys(self) -> Dict[str, Any]:
        """Load API keys from storage"""
        if self.keys_file.exists():
            try:
                with open(self.keys_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                debug("ERROR", f"Failed to load API keys: {str(e)}")
                return {}
        return {}
    
    def _save_keys(self):
        """Save API keys to storage"""
        try:
            with open(self.keys_file, 'w') as f:
                json.dump(self.keys, f, indent=2, default=str)
            debug("INFO", "API keys saved successfully")
        except Exception as e:
            debug("ERROR", f"Failed to save API keys: {str(e)}")
    
    def generate_key(self, name: str, description: str = "", 
                    permissions: List[str] = None, 
                    expires_in_days: int = 365) -> Dict[str, Any]:
        """Generate a new API key"""
        # Generate secure random key
        raw_key = secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        
        # Create key metadata
        key_data = {
            "name": name,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=expires_in_days)).isoformat(),
            "permissions": permissions or ["mcp.*"],
            "last_used": None,
            "usage_count": 0,
            "active": True
        }
        
        # Store hashed key
        self.keys[key_hash] = key_data
        self._save_keys()
        
        debug("INFO", f"Generated API key for: {name}")
        
        return {
            "key": raw_key,  # Return raw key only once
            "key_id": key_hash[:8],  # Short ID for reference
            "name": name,
            "expires_at": key_data["expires_at"],
            "permissions": key_data["permissions"]
        }
    
    def validate_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate an API key and return its metadata"""
        if not api_key:
            return None
            
        # Hash the provided key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Check if key exists
        if key_hash not in self.keys:
            debug("WARNING", f"Invalid API key attempted: {api_key[:8]}...")
            self._log_access(None, False, "Invalid key")
            return None
        
        key_data = self.keys[key_hash]
        
        # Check if key is active
        if not key_data.get("active", True):
            debug("WARNING", f"Inactive API key used: {key_data['name']}")
            self._log_access(key_data["name"], False, "Key inactive")
            return None
        
        # Check expiration
        expires_at = datetime.fromisoformat(key_data["expires_at"])
        if datetime.now() > expires_at:
            debug("WARNING", f"Expired API key used: {key_data['name']}")
            self._log_access(key_data["name"], False, "Key expired")
            return None
        
        # Update usage statistics
        key_data["last_used"] = datetime.now().isoformat()
        key_data["usage_count"] = key_data.get("usage_count", 0) + 1
        self._save_keys()
        
        # Log successful access
        self._log_access(key_data["name"], True, "Valid")
        debug("INFO", f"API key validated: {key_data['name']}")
        
        return {
            "name": key_data["name"],
            "permissions": key_data["permissions"],
            "usage_count": key_data["usage_count"]
        }
    
    def revoke_key(self, key_id: str) -> bool:
        """Revoke an API key by its ID or hash prefix"""
        for key_hash, key_data in self.keys.items():
            if key_hash.startswith(key_id) or key_data["name"] == key_id:
                key_data["active"] = False
                key_data["revoked_at"] = datetime.now().isoformat()
                self._save_keys()
                debug("INFO", f"API key revoked: {key_data['name']}")
                return True
        return False
    
    def list_keys(self) -> List[Dict[str, Any]]:
        """List all API keys with metadata (no actual keys)"""
        keys_list = []
        for key_hash, key_data in self.keys.items():
            keys_list.append({
                "key_id": key_hash[:8],
                "name": key_data["name"],
                "description": key_data.get("description", ""),
                "created_at": key_data["created_at"],
                "expires_at": key_data["expires_at"],
                "last_used": key_data.get("last_used"),
                "usage_count": key_data.get("usage_count", 0),
                "active": key_data.get("active", True),
                "permissions": key_data.get("permissions", [])
            })
        return keys_list
    
    def rotate_key(self, key_id: str) -> Optional[Dict[str, Any]]:
        """Rotate an existing API key"""
        # Find and revoke old key
        old_key_data = None
        for key_hash, key_data in self.keys.items():
            if key_hash.startswith(key_id) or key_data["name"] == key_id:
                old_key_data = key_data
                self.revoke_key(key_id)
                break
        
        if not old_key_data:
            return None
        
        # Generate new key with same permissions
        new_key = self.generate_key(
            name=f"{old_key_data['name']}_rotated",
            description=f"Rotated from {old_key_data['name']}",
            permissions=old_key_data.get("permissions", ["mcp.*"])
        )
        
        debug("INFO", f"API key rotated: {old_key_data['name']}")
        return new_key
    
    def _log_access(self, key_name: Optional[str], success: bool, reason: str):
        """Log API key access attempt"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "key_name": key_name,
            "success": success,
            "reason": reason
        }
        
        self.access_log.append(log_entry)
        
        # Keep only last 1000 entries
        if len(self.access_log) > 1000:
            self.access_log = self.access_log[-1000:]
    
    def get_access_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent API key access attempts"""
        return self.access_log[-limit:]
    
    def check_permission(self, key_data: Dict[str, Any], required_permission: str) -> bool:
        """Check if API key has required permission"""
        if not key_data:
            return False
            
        permissions = key_data.get("permissions", [])
        
        # Check for wildcard permission
        if "*" in permissions or "mcp.*" in permissions:
            return True
        
        # Check specific permission
        if required_permission in permissions:
            return True
        
        # Check prefix permission (e.g., "mcp.read" matches "mcp.read.*")
        for perm in permissions:
            if perm.endswith("*"):
                prefix = perm[:-1]
                if required_permission.startswith(prefix):
                    return True
        
        return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get API key usage statistics"""
        total_keys = len(self.keys)
        active_keys = sum(1 for k in self.keys.values() if k.get("active", True))
        expired_keys = sum(1 for k in self.keys.values() 
                          if datetime.now() > datetime.fromisoformat(k["expires_at"]))
        
        total_usage = sum(k.get("usage_count", 0) for k in self.keys.values())
        
        # Recent access stats
        recent_accesses = self.access_log[-100:]
        success_rate = (sum(1 for a in recent_accesses if a["success"]) / 
                       len(recent_accesses) * 100) if recent_accesses else 0
        
        return {
            "total_keys": total_keys,
            "active_keys": active_keys,
            "expired_keys": expired_keys,
            "revoked_keys": total_keys - active_keys - expired_keys,
            "total_api_calls": total_usage,
            "recent_success_rate": round(success_rate, 2),
            "access_log_entries": len(self.access_log)
        }

# Create singleton instance
api_key_manager = APIKeyManager()

# Generate default MCP key for Claude.ai if none exists
def ensure_claude_key():
    """Ensure a default API key exists for Claude.ai MCP connector"""
    keys = api_key_manager.list_keys()
    claude_key_exists = any(k["name"] == "claude_ai_mcp" for k in keys)
    
    if not claude_key_exists:
        key_info = api_key_manager.generate_key(
            name="claude_ai_mcp",
            description="Default API key for Claude.ai MCP connector",
            permissions=["mcp.*"],
            expires_in_days=365
        )
        
        # Save the key to a file for easy retrieval
        key_file = Path("backend/.claude_mcp_key.txt")
        with open(key_file, 'w') as f:
            f.write(f"Claude.ai MCP API Key\n")
            f.write(f"=====================\n\n")
            f.write(f"API Key: {key_info['key']}\n")
            f.write(f"Key ID: {key_info['key_id']}\n")
            f.write(f"Expires: {key_info['expires_at']}\n\n")
            f.write(f"Add this to your Claude.ai MCP configuration:\n")
            f.write(f"X-API-Key: {key_info['key']}\n")
        
        debug("INFO", f"Generated Claude.ai MCP key and saved to {key_file}")
        return key_info
    
    return None

# Initialize on import
ensure_claude_key()