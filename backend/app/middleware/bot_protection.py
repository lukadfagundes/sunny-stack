"""
Bot Protection and Security Middleware
Blocks malicious bots, exploit attempts, and suspicious requests
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import List, Dict, Set
import re
import time
import json
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
import hashlib
from ..utils.debug_helper import debug

class BotProtectionMiddleware(BaseHTTPMiddleware):
    """
    Advanced bot protection with:
    - Malicious path blocking
    - User agent filtering
    - Rate limiting
    - Suspicious pattern detection
    - Security logging
    """
    
    # Blocked paths and patterns (common exploit attempts)
    BLOCKED_PATHS = [
        # WordPress exploits
        r'^/wordpress',
        r'^/wp-admin',
        r'^/wp-content',
        r'^/wp-includes',
        r'^/wp-login\.php',
        r'^/xmlrpc\.php',
        
        # Admin panels
        r'^/admin(?!/api)',  # Block /admin but allow /api/admin
        r'^/administrator',
        r'^/phpmyadmin',
        r'^/pma',
        r'^/mysql',
        r'^/myadmin',
        r'^/phpMyAdmin',
        
        # Config and sensitive files
        r'^/\.env',
        r'^/\.git',
        r'^/\.svn',
        r'^/\.htaccess',
        r'^/config\.php',
        r'^/configuration\.php',
        r'^/web\.config',
        r'^/database\.yml',
        r'^/settings\.py',
        r'^/composer\.json',
        r'^/package\.json(?!$)',  # Block attempts to access but allow the exact file
        
        # Shell scripts and executables
        r'^/shell\.php',
        r'^/cmd\.php',
        r'^/backdoor',
        r'^/c99\.php',
        r'^/r57\.php',
        
        # Common CMS exploits
        r'^/joomla',
        r'^/drupal',
        r'^/magento',
        r'^/prestashop',
        
        # Scanner paths
        r'^/cgi-bin',
        r'^/scripts',
        r'^/fckeditor',
        r'^/ckeditor',
        r'^/tinymce',
        
        # Database files
        r'^.*\.sql$',
        r'^.*\.db$',
        r'^.*\.sqlite$',
        
        # Backup files
        r'^.*\.bak$',
        r'^.*\.backup$',
        r'^.*\.old$',
        r'^.*\.orig$',
        r'^.*~$',
        
        # Archive files (often used in attacks)
        r'^.*\.zip$',
        r'^.*\.tar$',
        r'^.*\.gz$',
        r'^.*\.rar$',
        
        # Other exploits
        r'^/eval-stdin\.php',
        r'^/invokefunction',
        r'^/solr/admin',
        r'^/api/jsonws',
        r'^/Autodiscover',
        r'^/\.well-known/security\.txt$',  # Block security.txt fishing
    ]
    
    # Suspicious user agents (known bots and scanners)
    BLOCKED_USER_AGENTS = [
        'sqlmap',
        'nikto',
        'nmap',
        'masscan',
        'metasploit',
        'burpsuite',
        'nessus',
        'openvas',
        'qualys',
        'acunetix',
        'zgrab',
        # 'python-requests',  # Temporarily allow for testing
        'curl',  # Block command line tools
        'wget',
        'go-http-client',
        'java/',
        'perl',
        'ruby',
        'scanner',
        'bot',
        'spider',
        'crawl',
        'scraper',
        'harvest',
        'fetch',
        'archive',
        'capture',
        'extract',
    ]
    
    # Whitelisted user agents (legitimate bots)
    ALLOWED_BOTS = [
        'googlebot',
        'bingbot',
        'slurp',  # Yahoo
        'duckduckbot',
        'facebookexternalhit',
        'twitterbot',
        'linkedinbot',
        'whatsapp',
        'telegram',
        'discord',
    ]
    
    def __init__(self, app, 
                 rate_limit_window: int = 60,  # seconds
                 rate_limit_max_requests: int = 100,
                 block_duration: int = 3600):  # seconds
        super().__init__(app)
        
        # Rate limiting
        self.rate_limit_window = rate_limit_window
        self.rate_limit_max_requests = rate_limit_max_requests
        self.request_counts = defaultdict(list)  # IP -> list of timestamps
        
        # Blocking
        self.block_duration = block_duration
        self.blocked_ips: Dict[str, datetime] = {}
        
        # Attack tracking
        self.attack_attempts = defaultdict(int)  # IP -> count
        self.attack_threshold = 5  # Block after 5 attempts
        
        # Compile regex patterns
        self.blocked_path_patterns = [re.compile(pattern, re.IGNORECASE) 
                                     for pattern in self.BLOCKED_PATHS]
        
        # Initialize security log
        self.security_log_file = Path("logs/security_threats.json")
        self.security_log_file.parent.mkdir(exist_ok=True)
        
        debug("SECURITY", "Bot Protection Middleware initialized")
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware handler"""
        
        # Get client information
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "").lower()
        path = request.url.path
        
        # Check if IP is currently blocked
        if await self._is_ip_blocked(client_ip):
            await self._log_security_event("blocked_ip", client_ip, path, "IP is temporarily blocked")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied - Your IP has been temporarily blocked"
            )
        
        # Check for malicious paths
        if await self._is_malicious_path(path):
            await self._handle_attack(client_ip, path, "malicious_path", user_agent)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,  # Return 404 to not reveal structure
                detail="Not found"
            )
        
        # Check for suspicious user agents
        if await self._is_suspicious_user_agent(user_agent):
            await self._handle_attack(client_ip, path, "suspicious_user_agent", user_agent)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied - Suspicious client detected"
            )
        
        # Check for SQL injection attempts in query parameters
        if await self._has_sql_injection_attempt(request):
            await self._handle_attack(client_ip, path, "sql_injection", str(request.url.query))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bad request"
            )
        
        # Check for XSS attempts in query parameters
        if await self._has_xss_attempt(request):
            await self._handle_attack(client_ip, path, "xss_attempt", str(request.url.query))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bad request"
            )
        
        # Rate limiting
        if not await self._check_rate_limit(client_ip):
            await self._handle_attack(client_ip, path, "rate_limit_exceeded", f"Exceeded {self.rate_limit_max_requests} requests")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests - Please slow down",
                headers={"Retry-After": str(self.rate_limit_window)}
            )
        
        # Add security headers to response
        response = await call_next(request)
        
        # Add comprehensive security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Remove server information
        response.headers.pop("Server", None)
        response.headers["Server"] = "Sunny-Platform"
        
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
    
    async def _is_malicious_path(self, path: str) -> bool:
        """Check if path matches known malicious patterns"""
        for pattern in self.blocked_path_patterns:
            if pattern.match(path):
                return True
        return False
    
    async def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Check if user agent is suspicious"""
        # Check if it's a whitelisted bot
        for allowed_bot in self.ALLOWED_BOTS:
            if allowed_bot in user_agent:
                return False
        
        # Check against blocked user agents
        for blocked_agent in self.BLOCKED_USER_AGENTS:
            if blocked_agent in user_agent:
                return True
        
        # Check for empty user agent (often scanners)
        if not user_agent or user_agent == "-":
            return True
        
        return False
    
    async def _has_sql_injection_attempt(self, request: Request) -> bool:
        """Detect SQL injection attempts in query parameters"""
        query = str(request.url.query)
        if not query:
            return False
        
        # Common SQL injection patterns
        sql_patterns = [
            r"(\bunion\b.*\bselect\b|\bselect\b.*\bunion\b)",
            r"(\bdrop\b.*\btable\b|\bdelete\b.*\bfrom\b)",
            r"(\binsert\b.*\binto\b|\bupdate\b.*\bset\b)",
            r"(\bexec\b|\bexecute\b)\s*\(",
            r"(\bscript\b|\balert\b)\s*\(",
            r"[';]--",
            r"\bor\b\s*'?1'?\s*=\s*'?1'?",
            r"\band\b\s*'?1'?\s*=\s*'?1'?",
            r"'?\s*or\s+'?[^']*'?\s*=\s*'",
            r"admin'?\s*--",
        ]
        
        query_lower = query.lower()
        for pattern in sql_patterns:
            if re.search(pattern, query_lower, re.IGNORECASE):
                return True
        
        return False
    
    async def _has_xss_attempt(self, request: Request) -> bool:
        """Detect XSS attempts in query parameters"""
        query = str(request.url.query)
        if not query:
            return False
        
        # Common XSS patterns
        xss_patterns = [
            r"<script[^>]*>",
            r"javascript:",
            r"on\w+\s*=",  # Event handlers like onclick=
            r"<iframe[^>]*>",
            r"<embed[^>]*>",
            r"<object[^>]*>",
            r"eval\s*\(",
            r"expression\s*\(",
            r"vbscript:",
            r"data:text/html",
        ]
        
        for pattern in xss_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return True
        
        return False
    
    async def _check_rate_limit(self, client_ip: str) -> bool:
        """Check if IP has exceeded rate limit"""
        now = time.time()
        
        # Clean old timestamps
        self.request_counts[client_ip] = [
            timestamp for timestamp in self.request_counts[client_ip]
            if now - timestamp < self.rate_limit_window
        ]
        
        # Add current request
        self.request_counts[client_ip].append(now)
        
        # Check limit
        return len(self.request_counts[client_ip]) <= self.rate_limit_max_requests
    
    async def _is_ip_blocked(self, client_ip: str) -> bool:
        """Check if IP is currently blocked"""
        if client_ip in self.blocked_ips:
            block_time = self.blocked_ips[client_ip]
            if datetime.utcnow() - block_time < timedelta(seconds=self.block_duration):
                return True
            else:
                # Unblock expired IP
                del self.blocked_ips[client_ip]
        return False
    
    async def _handle_attack(self, client_ip: str, path: str, attack_type: str, details: str = ""):
        """Handle detected attack attempt"""
        # Increment attack counter
        self.attack_attempts[client_ip] += 1
        
        # Log the attack
        await self._log_security_event(attack_type, client_ip, path, details)
        
        # Block IP if threshold exceeded
        if self.attack_attempts[client_ip] >= self.attack_threshold:
            self.blocked_ips[client_ip] = datetime.utcnow()
            debug("SECURITY", f"Blocked IP {client_ip} after {self.attack_attempts[client_ip]} attack attempts")
            await self._send_alert(client_ip, attack_type, path)
    
    async def _log_security_event(self, event_type: str, client_ip: str, path: str, details: str = ""):
        """Log security event to file"""
        try:
            # Load existing logs
            if self.security_log_file.exists():
                with open(self.security_log_file, 'r') as f:
                    logs = json.load(f)
            else:
                logs = []
            
            # Add new event
            event = {
                "timestamp": datetime.utcnow().isoformat(),
                "type": event_type,
                "ip": client_ip,
                "path": path,
                "details": details,
                "ip_hash": hashlib.sha256(client_ip.encode()).hexdigest()[:16]  # For privacy
            }
            logs.append(event)
            
            # Keep only last 10000 entries
            logs = logs[-10000:]
            
            # Save logs
            with open(self.security_log_file, 'w') as f:
                json.dump(logs, f, indent=2)
            
            # Also log to debug (debug is synchronous, not async)
            debug("SECURITY_THREAT", f"{event_type} from {client_ip} on {path}", details=details)
            
        except Exception as e:
            debug("SECURITY_ERROR", f"Failed to log security event: {e}")
    
    async def _send_alert(self, client_ip: str, attack_type: str, path: str):
        """Send alert for serious security threats"""
        # In production, this would send email/SMS/Slack notification
        alert_message = f"""
        SECURITY ALERT - sunny-stack.com
        
        Attack Type: {attack_type}
        Source IP: {client_ip}
        Target Path: {path}
        Time: {datetime.utcnow().isoformat()}
        Action: IP has been blocked for {self.block_duration} seconds
        
        Total attempts from this IP: {self.attack_attempts[client_ip]}
        """
        
        # Log the alert
        alert_file = Path("logs/security_alerts.txt")
        alert_file.parent.mkdir(exist_ok=True)
        
        with open(alert_file, 'a') as f:
            f.write(f"\n{'='*50}\n")
            f.write(alert_message)
            f.write(f"\n{'='*50}\n")
        
        debug("SECURITY_ALERT", alert_message)