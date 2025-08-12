"""
Security Monitoring API
Provides real-time security metrics and threat analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
from pathlib import Path
from collections import Counter

from ..auth.auth_system import auth_system
from ..utils.debug_helper import debug

router = APIRouter(prefix="/api/security", tags=["Security"])

async def require_admin(token: str = None):
    """Require admin role for security endpoints"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    user = await auth_system.verify_token(token)
    if not user or user.get("role") not in ["admin", "master_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user

@router.get("/threats/summary")
async def get_threat_summary(user: dict = Depends(require_admin)):
    """Get summary of recent security threats"""
    
    threats_file = Path("logs/security_threats.json")
    if not threats_file.exists():
        return {
            "total_threats": 0,
            "threats_24h": 0,
            "blocked_ips": 0,
            "top_attack_types": [],
            "recent_threats": []
        }
    
    with open(threats_file, 'r') as f:
        threats = json.load(f)
    
    # Analyze threats
    now = datetime.utcnow()
    threats_24h = []
    attack_types = []
    blocked_ips = set()
    
    for threat in threats:
        threat_time = datetime.fromisoformat(threat["timestamp"])
        
        # Count 24h threats
        if now - threat_time < timedelta(hours=24):
            threats_24h.append(threat)
        
        # Track attack types
        attack_types.append(threat["type"])
        
        # Track blocked IPs
        if threat["type"] == "blocked_ip":
            blocked_ips.add(threat["ip_hash"])
    
    # Get top attack types
    attack_counter = Counter(attack_types)
    top_attacks = [
        {"type": attack_type, "count": count}
        for attack_type, count in attack_counter.most_common(5)
    ]
    
    return {
        "total_threats": len(threats),
        "threats_24h": len(threats_24h),
        "blocked_ips": len(blocked_ips),
        "top_attack_types": top_attacks,
        "recent_threats": threats[-10:]  # Last 10 threats
    }

@router.get("/threats/timeline")
async def get_threat_timeline(
    hours: int = 24,
    user: dict = Depends(require_admin)
):
    """Get threat timeline for specified hours"""
    
    threats_file = Path("logs/security_threats.json")
    if not threats_file.exists():
        return {"timeline": []}
    
    with open(threats_file, 'r') as f:
        threats = json.load(f)
    
    # Create hourly buckets
    now = datetime.utcnow()
    timeline = []
    
    for i in range(hours):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)
        
        hour_threats = [
            threat for threat in threats
            if hour_start <= datetime.fromisoformat(threat["timestamp"]) < hour_end
        ]
        
        timeline.append({
            "hour": hour_start.isoformat(),
            "threats": len(hour_threats),
            "types": Counter([t["type"] for t in hour_threats])
        })
    
    timeline.reverse()  # Oldest first
    
    return {"timeline": timeline}

@router.get("/rate-limits/status")
async def get_rate_limit_status(user: dict = Depends(require_admin)):
    """Get current rate limiting status"""
    
    rate_limit_file = Path("logs/rate_limits.json")
    if not rate_limit_file.exists():
        return {
            "total_limited": 0,
            "recent_violations": [],
            "blocked_ips": 0
        }
    
    with open(rate_limit_file, 'r') as f:
        rate_limits = json.load(f)
    
    # Analyze rate limits
    blocked_ips = set()
    recent_violations = []
    
    for event in rate_limits:
        if event["type"] == "blocked":
            blocked_ips.add(event["ip_hash"])
        
        # Get recent violations
        event_time = datetime.fromisoformat(event["timestamp"])
        if datetime.utcnow() - event_time < timedelta(hours=1):
            recent_violations.append(event)
    
    return {
        "total_limited": len(rate_limits),
        "recent_violations": recent_violations[-20:],  # Last 20 violations
        "blocked_ips": len(blocked_ips),
        "top_violated_endpoints": Counter([e["endpoint"] for e in rate_limits]).most_common(5)
    }

@router.get("/blocked-paths")
async def get_blocked_paths_attempts(user: dict = Depends(require_admin)):
    """Get attempts to access blocked paths"""
    
    threats_file = Path("logs/security_threats.json")
    if not threats_file.exists():
        return {"blocked_paths": []}
    
    with open(threats_file, 'r') as f:
        threats = json.load(f)
    
    # Filter for malicious path attempts
    path_attempts = [
        threat for threat in threats
        if threat["type"] == "malicious_path"
    ]
    
    # Group by path
    path_counter = Counter([attempt["path"] for attempt in path_attempts])
    
    blocked_paths = [
        {
            "path": path,
            "attempts": count,
            "last_attempt": max(
                [a["timestamp"] for a in path_attempts if a["path"] == path],
                default="Never"
            )
        }
        for path, count in path_counter.most_common(20)
    ]
    
    return {
        "total_attempts": len(path_attempts),
        "unique_paths": len(path_counter),
        "blocked_paths": blocked_paths
    }

@router.post("/alerts/test")
async def test_security_alert(user: dict = Depends(require_admin)):
    """Test security alert system"""
    
    test_alert = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "test_alert",
        "message": "This is a test security alert",
        "severity": "info",
        "user": user["email"]
    }
    
    # Log test alert
    alert_file = Path("logs/security_alerts.txt")
    alert_file.parent.mkdir(exist_ok=True)
    
    with open(alert_file, 'a') as f:
        f.write(f"\n{'='*50}\n")
        f.write(f"TEST ALERT - {test_alert['timestamp']}\n")
        f.write(f"Initiated by: {test_alert['user']}\n")
        f.write(f"Message: {test_alert['message']}\n")
        f.write(f"{'='*50}\n")
    
    await debug("SECURITY_TEST", "Test alert generated", user=user["email"])
    
    return {
        "status": "success",
        "alert": test_alert
    }

@router.get("/audit-log")
async def get_audit_log(
    limit: int = 100,
    user: dict = Depends(require_admin)
):
    """Get security audit log"""
    
    events = []
    
    # Collect from various log files
    log_files = {
        "threats": Path("logs/security_threats.json"),
        "rate_limits": Path("logs/rate_limits.json"),
        "ip_blocks": Path("logs/ip_blocks.json")
    }
    
    for log_type, log_file in log_files.items():
        if log_file.exists():
            with open(log_file, 'r') as f:
                log_data = json.load(f)
                for entry in log_data:
                    entry["log_type"] = log_type
                    events.append(entry)
    
    # Sort by timestamp
    events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # Limit results
    events = events[:limit]
    
    return {
        "total_events": len(events),
        "events": events
    }

@router.post("/whitelist/add")
async def add_to_whitelist(
    ip: str,
    reason: str,
    user: dict = Depends(require_admin)
):
    """Add IP to whitelist"""
    
    whitelist_file = Path("config/ip_whitelist.json")
    whitelist_file.parent.mkdir(exist_ok=True)
    
    # Load existing whitelist
    if whitelist_file.exists():
        with open(whitelist_file, 'r') as f:
            whitelist = json.load(f)
    else:
        whitelist = []
    
    # Add new entry
    whitelist.append({
        "ip": ip,
        "reason": reason,
        "added_by": user["email"],
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Save whitelist
    with open(whitelist_file, 'w') as f:
        json.dump(whitelist, f, indent=2)
    
    await debug("SECURITY_WHITELIST", f"Added {ip} to whitelist", user=user["email"])
    
    return {
        "status": "success",
        "message": f"Added {ip} to whitelist"
    }

@router.get("/health")
async def security_health_check():
    """Public endpoint to check security system health"""
    
    return {
        "status": "operational",
        "bot_protection": "active",
        "rate_limiting": "active",
        "authentication": "active",
        "monitoring": "active",
        "timestamp": datetime.utcnow().isoformat()
    }