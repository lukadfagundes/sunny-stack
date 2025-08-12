"""
Advanced Rate Limiting Middleware
Implements per-endpoint and per-IP rate limiting with adaptive thresholds
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple, Optional
import time
import json
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict, deque
import hashlib
from ..utils.debug_helper import debug

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Advanced rate limiting with:
    - Per-endpoint limits
    - Per-IP tracking
    - Adaptive rate limiting
    - Burst protection
    - Distributed tracking (ready for Redis)
    """
    
    # Default rate limits (requests, window_seconds)
    ENDPOINT_LIMITS = {
        # Authentication endpoints - stricter limits
        "/api/auth/login": (5, 60),  # 5 attempts per minute
        "/api/auth/request-reset": (3, 300),  # 3 attempts per 5 minutes
        "/api/auth/reset-password": (3, 300),  # 3 attempts per 5 minutes
        
        # MCP endpoints - moderate limits
        "/api/mcp/files/write": (30, 60),  # 30 writes per minute
        "/api/mcp/files/read": (100, 60),  # 100 reads per minute
        "/api/mcp/files/tree": (10, 60),  # 10 tree requests per minute
        "/api/mcp/git": (10, 60),  # 10 git operations per minute
        
        # Analysis endpoints - relaxed limits
        "/api/analysis": (60, 60),  # 60 requests per minute
        "/api/projects": (60, 60),  # 60 requests per minute
        
        # Default for all other endpoints
        "default": (100, 60),  # 100 requests per minute
    }
    
    # Burst limits (max requests in 10 seconds)
    BURST_LIMITS = {
        "/api/auth/login": 3,
        "/api/auth/request-reset": 2,
        "/api/mcp/files/write": 10,
        "default": 20,
    }
    
    def __init__(self, app,
                 enable_adaptive: bool = True,
                 block_duration: int = 300):  # 5 minutes
        super().__init__(app)
        
        # Rate tracking
        self.request_history: Dict[str, Dict[str, deque]] = defaultdict(lambda: defaultdict(deque))
        # Structure: {endpoint: {ip: deque of timestamps}}
        
        # Blocked IPs
        self.blocked_until: Dict[str, datetime] = {}
        
        # Adaptive rate limiting
        self.enable_adaptive = enable_adaptive
        self.violation_counts: Dict[str, int] = defaultdict(int)  # IP -> violation count
        
        # Block duration
        self.block_duration = block_duration
        
        # Statistics
        self.stats = {
            "total_requests": 0,
            "blocked_requests": 0,
            "rate_limited_requests": 0,
            "unique_ips": set(),
        }
        
        # Initialize rate limit log
        self.rate_limit_log = Path("logs/rate_limits.json")
        self.rate_limit_log.parent.mkdir(exist_ok=True)
        
        debug("RATE_LIMITER", "Rate Limiter Middleware initialized")
    
    async def dispatch(self, request: Request, call_next):
        """Main rate limiting handler"""
        
        # Get client information
        client_ip = self._get_client_ip(request)
        endpoint = self._normalize_endpoint(request.url.path)
        
        # Update statistics
        self.stats["total_requests"] += 1
        self.stats["unique_ips"].add(client_ip)
        
        # Check if IP is blocked
        if await self._is_blocked(client_ip):
            self.stats["blocked_requests"] += 1
            await self._log_rate_limit_event("blocked", client_ip, endpoint)
            
            remaining_time = (self.blocked_until[client_ip] - datetime.utcnow()).seconds
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many violations. Blocked for {remaining_time} seconds",
                headers={"Retry-After": str(remaining_time)}
            )
        
        # Check burst limit
        if not await self._check_burst_limit(client_ip, endpoint):
            await self._handle_violation(client_ip, endpoint, "burst_limit")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Request burst detected. Please slow down",
                headers={"Retry-After": "10"}
            )
        
        # Check rate limit
        allowed, retry_after = await self._check_rate_limit(client_ip, endpoint)
        if not allowed:
            await self._handle_violation(client_ip, endpoint, "rate_limit")
            self.stats["rate_limited_requests"] += 1
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self._get_limit(endpoint)[0]),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + retry_after)
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        limit, window = self._get_limit(endpoint)
        remaining = await self._get_remaining_requests(client_ip, endpoint)
        
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + window)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract real client IP from request"""
        # Check for proxy headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        cf_connecting_ip = request.headers.get("CF-Connecting-IP")  # Cloudflare
        if cf_connecting_ip:
            return cf_connecting_ip
        
        return request.client.host
    
    def _normalize_endpoint(self, path: str) -> str:
        """Normalize endpoint path for rate limiting"""
        # Remove trailing slashes
        path = path.rstrip("/")
        
        # Group similar endpoints
        if path.startswith("/api/mcp/files"):
            # Extract the specific operation
            if "/write" in path:
                return "/api/mcp/files/write"
            elif "/read" in path:
                return "/api/mcp/files/read"
            elif "/tree" in path:
                return "/api/mcp/files/tree"
            else:
                return "/api/mcp/files"
        
        if path.startswith("/api/mcp/git"):
            return "/api/mcp/git"
        
        if path.startswith("/api/auth"):
            # Keep auth endpoints specific
            for auth_endpoint in ["/login", "/request-reset", "/reset-password"]:
                if auth_endpoint in path:
                    return f"/api/auth{auth_endpoint}"
        
        # Return the base API path for grouping
        if path.startswith("/api/"):
            parts = path.split("/")
            if len(parts) >= 3:
                return f"/api/{parts[2]}"
        
        return path
    
    def _get_limit(self, endpoint: str) -> Tuple[int, int]:
        """Get rate limit for endpoint"""
        if endpoint in self.ENDPOINT_LIMITS:
            return self.ENDPOINT_LIMITS[endpoint]
        
        # Check for pattern match
        for pattern, limit in self.ENDPOINT_LIMITS.items():
            if pattern != "default" and endpoint.startswith(pattern):
                return limit
        
        return self.ENDPOINT_LIMITS["default"]
    
    def _get_burst_limit(self, endpoint: str) -> int:
        """Get burst limit for endpoint"""
        if endpoint in self.BURST_LIMITS:
            return self.BURST_LIMITS[endpoint]
        
        for pattern, limit in self.BURST_LIMITS.items():
            if pattern != "default" and endpoint.startswith(pattern):
                return limit
        
        return self.BURST_LIMITS["default"]
    
    async def _check_rate_limit(self, client_ip: str, endpoint: str) -> Tuple[bool, int]:
        """
        Check if request is within rate limit
        Returns: (allowed, retry_after_seconds)
        """
        limit, window = self._get_limit(endpoint)
        now = time.time()
        
        # Get request history for this IP and endpoint
        history = self.request_history[endpoint][client_ip]
        
        # Remove old requests outside the window
        while history and history[0] < now - window:
            history.popleft()
        
        # Check if under limit
        if len(history) < limit:
            # Add current request
            history.append(now)
            return (True, 0)
        
        # Calculate retry after
        oldest_request = history[0]
        retry_after = int(oldest_request + window - now) + 1
        
        return (False, retry_after)
    
    async def _check_burst_limit(self, client_ip: str, endpoint: str) -> bool:
        """Check if request is within burst limit (10 second window)"""
        burst_limit = self._get_burst_limit(endpoint)
        burst_window = 10  # seconds
        now = time.time()
        
        # Get request history
        history = self.request_history[endpoint][client_ip]
        
        # Count requests in burst window
        burst_count = sum(1 for ts in history if ts > now - burst_window)
        
        return burst_count < burst_limit
    
    async def _get_remaining_requests(self, client_ip: str, endpoint: str) -> int:
        """Get remaining requests for this period"""
        limit, window = self._get_limit(endpoint)
        now = time.time()
        
        history = self.request_history[endpoint][client_ip]
        
        # Count recent requests
        recent_count = sum(1 for ts in history if ts > now - window)
        
        return max(0, limit - recent_count)
    
    async def _is_blocked(self, client_ip: str) -> bool:
        """Check if IP is currently blocked"""
        if client_ip in self.blocked_until:
            if datetime.utcnow() < self.blocked_until[client_ip]:
                return True
            else:
                # Unblock expired IP
                del self.blocked_until[client_ip]
                self.violation_counts[client_ip] = 0
        return False
    
    async def _handle_violation(self, client_ip: str, endpoint: str, violation_type: str):
        """Handle rate limit violation"""
        self.violation_counts[client_ip] += 1
        
        # Log violation
        await self._log_rate_limit_event(violation_type, client_ip, endpoint)
        
        # Adaptive blocking - block after repeated violations
        if self.enable_adaptive:
            if self.violation_counts[client_ip] >= 5:
                # Block IP for increasing duration based on violations
                block_minutes = min(self.violation_counts[client_ip] * 5, 60)  # Max 1 hour
                self.blocked_until[client_ip] = datetime.utcnow() + timedelta(minutes=block_minutes)
                
                await debug("RATE_LIMITER", 
                          f"Blocked IP {client_ip} for {block_minutes} minutes after {self.violation_counts[client_ip]} violations")
                
                await self._send_rate_limit_alert(client_ip, endpoint, violation_type)
    
    async def _log_rate_limit_event(self, event_type: str, client_ip: str, endpoint: str):
        """Log rate limit event"""
        try:
            # Load existing logs
            if self.rate_limit_log.exists():
                with open(self.rate_limit_log, 'r') as f:
                    logs = json.load(f)
            else:
                logs = []
            
            # Add new event
            event = {
                "timestamp": datetime.utcnow().isoformat(),
                "type": event_type,
                "ip": client_ip,
                "endpoint": endpoint,
                "violations": self.violation_counts.get(client_ip, 0),
                "ip_hash": hashlib.sha256(client_ip.encode()).hexdigest()[:16]
            }
            logs.append(event)
            
            # Keep only last 5000 entries
            logs = logs[-5000:]
            
            # Save logs
            with open(self.rate_limit_log, 'w') as f:
                json.dump(logs, f, indent=2)
            
        except Exception as e:
            await debug("RATE_LIMITER_ERROR", f"Failed to log rate limit event: {e}")
    
    async def _send_rate_limit_alert(self, client_ip: str, endpoint: str, violation_type: str):
        """Send alert for excessive rate limit violations"""
        alert_message = f"""
        RATE LIMIT ALERT - sunny-stack.com
        
        IP Address: {client_ip}
        Endpoint: {endpoint}
        Violation Type: {violation_type}
        Total Violations: {self.violation_counts[client_ip]}
        Time: {datetime.utcnow().isoformat()}
        Action: IP blocked for extended period
        """
        
        # Log the alert
        alert_file = Path("logs/rate_limit_alerts.txt")
        alert_file.parent.mkdir(exist_ok=True)
        
        with open(alert_file, 'a') as f:
            f.write(f"\n{'='*50}\n")
            f.write(alert_message)
            f.write(f"\n{'='*50}\n")
        
        await debug("RATE_LIMIT_ALERT", alert_message)
    
    async def get_stats(self) -> dict:
        """Get rate limiter statistics"""
        return {
            "total_requests": self.stats["total_requests"],
            "blocked_requests": self.stats["blocked_requests"],
            "rate_limited_requests": self.stats["rate_limited_requests"],
            "unique_ips": len(self.stats["unique_ips"]),
            "currently_blocked_ips": len(self.blocked_until),
            "active_endpoints": list(self.request_history.keys()),
        }