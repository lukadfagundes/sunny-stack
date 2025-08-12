"""
Emergency Access Logger
Monitors all access during authentication-disabled development mode
"""

from fastapi import Request
from datetime import datetime
import json
import os
from pathlib import Path
from typing import Dict, Any

class EmergencyAccessLogger:
    """Log all access attempts during emergency mode"""
    
    def __init__(self):
        self.log_file = Path("backend/logs/emergency_access.log")
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self.session_start = datetime.now()
        
        # Log emergency mode activation
        self._log_event({
            "event": "EMERGENCY_MODE_ACTIVATED",
            "timestamp": self.session_start.isoformat(),
            "reason": "Claude integration - authentication disabled",
            "warning": "ALL ENDPOINTS ARE PUBLICLY ACCESSIBLE"
        })
    
    async def log_access(self, request: Request, response_status: int = None):
        """Log each access attempt"""
        client_host = request.client.host if request.client else "unknown"
        
        # Extract headers (excluding sensitive data)
        headers = dict(request.headers)
        if "authorization" in headers:
            headers["authorization"] = "***REDACTED***"
        if "cookie" in headers:
            headers["cookie"] = "***REDACTED***"
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "method": request.method,
            "path": str(request.url.path),
            "query": str(request.url.query) if request.url.query else None,
            "client_ip": client_host,
            "user_agent": headers.get("user-agent", "unknown"),
            "referer": headers.get("referer"),
            "response_status": response_status,
            "emergency_mode": True,
            "authentication": "DISABLED",
            "warning": "PUBLIC_ACCESS"
        }
        
        # Special tracking for sensitive endpoints
        sensitive_paths = [
            "/api/mcp/files/write",
            "/api/mcp/files/delete",
            "/api/mcp/git",
            "/api/self-improvement",
            "/api/projects"
        ]
        
        for sensitive in sensitive_paths:
            if request.url.path.startswith(sensitive):
                log_entry["ALERT"] = "SENSITIVE_ENDPOINT_ACCESSED"
                log_entry["risk_level"] = "HIGH"
                break
        
        self._log_event(log_entry)
        
        # Also log to console for real-time monitoring
        if log_entry.get("ALERT"):
            print(f"⚠️ EMERGENCY ACCESS ALERT: {client_host} accessed {request.url.path}")
        
        return log_entry
    
    def _log_event(self, event: Dict[str, Any]):
        """Write event to log file"""
        try:
            with open(self.log_file, "a") as f:
                f.write(json.dumps(event) + "\n")
        except Exception as e:
            print(f"Failed to write to emergency log: {e}")
    
    def get_access_summary(self) -> Dict[str, Any]:
        """Get summary of all access during emergency mode"""
        if not self.log_file.exists():
            return {"error": "No emergency access log found"}
        
        summary = {
            "session_start": self.session_start.isoformat(),
            "duration": str(datetime.now() - self.session_start),
            "total_requests": 0,
            "unique_ips": set(),
            "endpoints_accessed": {},
            "sensitive_access_count": 0,
            "alerts": []
        }
        
        try:
            with open(self.log_file, "r") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        if entry.get("event") != "EMERGENCY_MODE_ACTIVATED":
                            summary["total_requests"] += 1
                            
                            if entry.get("client_ip"):
                                summary["unique_ips"].add(entry["client_ip"])
                            
                            path = entry.get("path", "unknown")
                            summary["endpoints_accessed"][path] = \
                                summary["endpoints_accessed"].get(path, 0) + 1
                            
                            if entry.get("ALERT"):
                                summary["sensitive_access_count"] += 1
                                summary["alerts"].append({
                                    "timestamp": entry["timestamp"],
                                    "ip": entry.get("client_ip"),
                                    "endpoint": path,
                                    "alert": entry["ALERT"]
                                })
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            summary["error"] = f"Failed to read log: {e}"
        
        summary["unique_ips"] = list(summary["unique_ips"])
        return summary

# Global instance
emergency_logger = EmergencyAccessLogger()