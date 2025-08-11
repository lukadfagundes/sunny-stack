from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random

from ..utils.debug_helper import debug_decorator, debug_api

router = APIRouter()

class SessionStart(BaseModel):
    projectId: Optional[str] = None
    startTime: str

class SessionEnd(BaseModel):
    projectId: Optional[str] = None
    duration: str
    metrics: Dict[str, int]

@router.get("/dashboard")
@debug_decorator("API")
async def get_dashboard_metrics():
    """Get real-time dashboard metrics"""
    
    metrics = {
        "revenue": {
            "current_month": 125000,
            "last_month": 98000,
            "growth": 27.5,
            "projected": 150000
        },
        "projects": {
            "active": 7,
            "completed": 23,
            "pipeline": 12,
            "success_rate": 98.5
        },
        "performance": {
            "average_delivery_days": 21,
            "client_satisfaction": 4.8,
            "code_quality_score": 9.2,
            "test_coverage": 85
        },
        "ai_usage": {
            "claude_web_sessions": 156,
            "claude_code_builds": 423,
            "tokens_used": 2450000,
            "efficiency_gain": "10x"
        },
        "team": {
            "active_sessions": 3,
            "hours_saved": 320,
            "automation_rate": 75,
            "productivity_index": 9.5
        }
    }
    
    debug_api("Dashboard metrics retrieved", 
             revenue=metrics["revenue"]["current_month"],
             active_projects=metrics["projects"]["active"])
    
    return metrics

@router.post("/session/start")
@debug_decorator("API")
async def start_session(session: SessionStart):
    """Start a development session"""
    debug_api("Session started", 
             project_id=session.projectId,
             start_time=session.startTime)
    
    return {
        "session_id": f"sess_{datetime.now().timestamp()}",
        "status": "active",
        "monitoring": True
    }

@router.post("/session/end")
@debug_decorator("API")
async def end_session(session: SessionEnd):
    """End a development session"""
    debug_api("Session ended",
             project_id=session.projectId,
             duration=session.duration)
    
    return {
        "status": "completed",
        "summary": {
            "duration": session.duration,
            "metrics": session.metrics,
            "productivity_score": random.randint(85, 98)
        }
    }

@router.get("/realtime")
@debug_decorator("API")
async def get_realtime_metrics():
    """Get real-time metrics stream"""
    
    updates = []
    
    for i in range(5):
        update_types = [
            ("Build completed successfully", "success"),
            ("Running automated tests...", "info"),
            ("Code quality check passed", "success"),
            ("Deploying to staging environment", "info"),
            ("Performance optimization applied", "success"),
            ("Security scan completed", "info"),
            ("Database migration executed", "success")
        ]
        
        message, type_val = random.choice(update_types)
        
        updates.append({
            "id": f"update_{datetime.now().timestamp()}_{i}",
            "type": type_val,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "project": "current"
        })
    
    debug_api("Realtime updates generated", count=len(updates))
    
    return {"updates": updates}

@router.get("/analytics/revenue")
@debug_decorator("API")
async def get_revenue_analytics():
    """Get revenue analytics data"""
    
    months = []
    for i in range(6, 0, -1):
        date = datetime.now() - timedelta(days=i*30)
        revenue = 50000 + random.randint(0, 50000)
        months.append({
            "month": date.strftime("%B"),
            "revenue": revenue,
            "projects": random.randint(3, 8),
            "growth": random.uniform(-10, 30)
        })
    
    return {
        "monthly_data": months,
        "total_revenue": sum(m["revenue"] for m in months),
        "average_project_value": 45000,
        "recurring_revenue": 15000
    }

@router.get("/analytics/clients")
@debug_decorator("API")
async def get_client_analytics():
    """Get client analytics data"""
    
    clients = [
        {
            "name": "TechCorp Inc",
            "projects": 5,
            "total_value": 225000,
            "satisfaction": 4.9,
            "status": "active"
        },
        {
            "name": "StartupXYZ",
            "projects": 3,
            "total_value": 75000,
            "satisfaction": 4.7,
            "status": "active"
        },
        {
            "name": "Enterprise Solutions Ltd",
            "projects": 8,
            "total_value": 450000,
            "satisfaction": 4.8,
            "status": "active"
        }
    ]
    
    return {
        "clients": clients,
        "total_clients": len(clients),
        "retention_rate": 95,
        "nps_score": 72
    }