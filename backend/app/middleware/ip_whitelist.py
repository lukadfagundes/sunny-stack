"""
IP Whitelist Middleware for Extra Security
Optionally restricts access to certain endpoints based on IP address
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import List, Optional
import os
from ..utils.debug_helper import debug

class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    Middleware to restrict access based on IP whitelist
    """
    
    def __init__(self, app, allowed_ips: Optional[List[str]] = None, protected_paths: List[str] = None):
        super().__init__(app)
        
        # Load IPs from environment or use provided list
        env_ips = os.getenv("ALLOWED_IPS", "").strip()
        if env_ips:
            self.allowed_ips = [ip.strip() for ip in env_ips.split(",")]
        else:
            self.allowed_ips = allowed_ips or []
        
        # Always allow localhost
        self.allowed_ips.extend(["127.0.0.1", "::1", "localhost"])
        
        # Paths that require IP whitelist (if enabled)
        self.protected_paths = protected_paths or ["/api/mcp", "/api/admin"]
        
        # Check if IP whitelist is enabled
        self.enabled = os.getenv("ENABLE_IP_WHITELIST", "false").lower() == "true"
        
        if self.enabled:
            debug("SECURITY", f"IP Whitelist enabled for paths: {self.protected_paths}")
            debug("SECURITY", f"Allowed IPs: {self.allowed_ips}")
    
    async def dispatch(self, request: Request, call_next):
        """Check IP against whitelist for protected paths"""
        
        # Skip if not enabled
        if not self.enabled:
            return await call_next(request)
        
        # Check if path needs protection
        path = request.url.path
        
        # NEVER protect /api/mcp/public or /api/mcp/open - they're meant to be PUBLIC!
        if path.startswith("/api/mcp/public") or path.startswith("/api/mcp/open"):
            return await call_next(request)
            
        needs_protection = any(path.startswith(protected) for protected in self.protected_paths)
        
        if not needs_protection:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host
        
        # Handle proxy headers if behind reverse proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Get the first IP in the chain (original client)
            client_ip = forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            client_ip = real_ip
        
        # Check whitelist
        if client_ip not in self.allowed_ips:
            debug("SECURITY", f"Blocked access from IP: {client_ip} to {path}")
            
            # Log the attempt
            self._log_blocked_attempt(client_ip, path)
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied from your IP address"
            )
        
        # IP is allowed, proceed
        response = await call_next(request)
        return response
    
    def _log_blocked_attempt(self, ip: str, path: str):
        """Log blocked access attempts"""
        import json
        from datetime import datetime
        from pathlib import Path
        
        log_file = Path("logs/ip_blocks.json")
        log_file.parent.mkdir(exist_ok=True)
        
        # Load existing logs
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = json.load(f)
        else:
            logs = []
        
        # Add new entry
        logs.append({
            "timestamp": datetime.utcnow().isoformat(),
            "ip": ip,
            "path": path
        })
        
        # Keep only last 1000 entries
        logs = logs[-1000:]
        
        # Save logs
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)