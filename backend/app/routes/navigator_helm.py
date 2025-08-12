"""
Navigator's Helm API Routes
Multi-assistant industrial equipment intelligence platform
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from ..utils.debug_helper import debug, debug_decorator
from .auth_routes import get_current_user

router = APIRouter(prefix="/navigator-helm", tags=["Navigator's Helm"])

# Data Models
class Equipment(BaseModel):
    id: str
    name: str
    type: str
    status: str
    location: Optional[str] = None
    last_maintenance: Optional[datetime] = None
    metrics: Dict[str, Any] = {}

class AssistantResponse(BaseModel):
    assistant: str  # Navigator's Helm, Stilltide, Tempest, or Firebird
    analysis: str
    confidence: float
    recommendations: List[str]
    timestamp: datetime = datetime.now()

class EvaluationRequest(BaseModel):
    equipment_id: str
    evaluation_type: str
    parameters: Dict[str, Any] = {}

# Navigator's Helm Main Routes
@router.get("/status")
@debug_decorator("NAVIGATOR")
async def get_navigator_status(current_user: Dict = Depends(get_current_user)):
    """Get Navigator's Helm system status"""
    debug("NAVIGATOR", f"Status check by user: {current_user.get('email', 'unknown')}")
    return {
        "status": "operational",
        "assistants": {
            "navigator_helm": {"status": "active", "role": "Orchestrator"},
            "stilltide": {"status": "active", "role": "Analytics"},
            "tempest": {"status": "active", "role": "Predictions"},
            "firebird": {"status": "active", "role": "Critical Systems"}
        },
        "version": "2.0.0",
        "rebrand_from": "NavigatorCore"
    }

@router.get("/equipment")
@debug_decorator("NAVIGATOR")
async def get_equipment_list(
    current_user: Dict = Depends(get_current_user),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None)
):
    """Get list of monitored equipment"""
    debug("NAVIGATOR", f"Equipment list requested by: {current_user.get('email', 'unknown')}")
    
    # Mock data for now - will be replaced with database queries
    equipment = [
        Equipment(
            id="equip-001",
            name="Primary Turbine",
            type="turbine",
            status="operational",
            location="Plant A - Section 3",
            last_maintenance=datetime.now(),
            metrics={"rpm": 3600, "temperature": 75.5, "efficiency": 92.3}
        ),
        Equipment(
            id="equip-002",
            name="Backup Generator",
            type="generator",
            status="standby",
            location="Plant A - Section 1",
            metrics={"fuel_level": 85, "ready_state": True}
        ),
        Equipment(
            id="equip-003",
            name="Cooling System Alpha",
            type="cooling",
            status="maintenance",
            location="Plant B - Section 2",
            metrics={"flow_rate": 0, "scheduled_return": "2025-08-15"}
        )
    ]
    
    # Apply filters
    if status:
        equipment = [e for e in equipment if e.status == status]
    if type:
        equipment = [e for e in equipment if e.type == type]
    
    return equipment

@router.post("/evaluate")
@debug_decorator("NAVIGATOR")
async def evaluate_equipment(
    request: EvaluationRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Request multi-assistant evaluation of equipment"""
    debug("NAVIGATOR", f"Evaluation requested for {request.equipment_id} by {current_user.get('email', 'unknown')}")
    
    # Simulate multi-assistant evaluation
    responses = []
    
    # Navigator's Helm orchestration
    responses.append(AssistantResponse(
        assistant="navigator_helm",
        analysis="Equipment showing normal operational parameters within expected ranges",
        confidence=0.95,
        recommendations=[
            "Continue standard monitoring protocol",
            "Schedule routine maintenance in 30 days"
        ]
    ))
    
    # Stilltide analytics
    responses.append(AssistantResponse(
        assistant="stilltide",
        analysis="Historical data analysis shows 3% efficiency degradation over past quarter",
        confidence=0.88,
        recommendations=[
            "Investigate potential causes of efficiency loss",
            "Compare with similar equipment performance"
        ]
    ))
    
    # Tempest predictions
    responses.append(AssistantResponse(
        assistant="tempest",
        analysis="Predictive model indicates 78% probability of component wear within 60 days",
        confidence=0.72,
        recommendations=[
            "Order replacement parts preemptively",
            "Increase monitoring frequency"
        ]
    ))
    
    # Firebird critical systems
    responses.append(AssistantResponse(
        assistant="firebird",
        analysis="No critical safety concerns detected. All safety parameters nominal",
        confidence=0.99,
        recommendations=[
            "Maintain current safety protocols",
            "Update emergency response plan with latest metrics"
        ]
    ))
    
    return {
        "equipment_id": request.equipment_id,
        "evaluation_type": request.evaluation_type,
        "timestamp": datetime.now(),
        "responses": responses,
        "overall_status": "operational",
        "action_required": False
    }

@router.get("/stilltide/dashboard")
@debug_decorator("STILLTIDE")
async def get_stilltide_dashboard(current_user: Dict = Depends(get_current_user)):
    """Get Stilltide analytics dashboard data"""
    debug("STILLTIDE", f"Dashboard requested by: {current_user.get('email', 'unknown')}")
    
    return {
        "dashboard": "stilltide",
        "timestamp": datetime.now(),
        "metrics": {
            "total_equipment": 47,
            "operational": 42,
            "maintenance": 3,
            "critical": 2,
            "efficiency_average": 89.7,
            "uptime_percentage": 96.3
        },
        "trends": {
            "efficiency": {"direction": "down", "change": -1.2},
            "uptime": {"direction": "up", "change": 0.8},
            "maintenance_cost": {"direction": "stable", "change": 0.1}
        },
        "recent_events": [
            {
                "timestamp": datetime.now(),
                "equipment": "Primary Turbine",
                "event": "Routine inspection completed",
                "severity": "info"
            },
            {
                "timestamp": datetime.now(),
                "equipment": "Cooling System Alpha",
                "event": "Scheduled maintenance started",
                "severity": "warning"
            }
        ]
    }

@router.post("/command")
@debug_decorator("NAVIGATOR")
async def send_command(
    equipment_id: str,
    command: str,
    parameters: Dict[str, Any] = {},
    current_user: Dict = Depends(get_current_user)
):
    """Send command to equipment (requires elevated permissions)"""
    debug("NAVIGATOR", f"Command '{command}' for {equipment_id} by {current_user.get('email', 'unknown')}")
    
    # Check permissions (simplified for now)
    if current_user.get('role') != "master_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions for equipment commands")
    
    return {
        "status": "success",
        "equipment_id": equipment_id,
        "command": command,
        "parameters": parameters,
        "executed_by": current_user.get('email', 'unknown'),
        "timestamp": datetime.now(),
        "result": "Command queued for execution"
    }

@router.get("/landing")
@debug_decorator("NAVIGATOR")
async def get_landing_page_data():
    """Get data for Navigator's Helm landing page (public)"""
    return {
        "title": "Navigator's Helm",
        "subtitle": "Industrial Equipment Intelligence Platform",
        "features": [
            {
                "name": "Navigator's Helm",
                "role": "Master Orchestrator",
                "description": "Coordinates multi-assistant analysis and decision-making"
            },
            {
                "name": "Stilltide",
                "role": "Analytics Engine",
                "description": "Deep historical analysis and pattern recognition"
            },
            {
                "name": "Tempest",
                "role": "Predictive Intelligence",
                "description": "Forecasting and preventive maintenance planning"
            },
            {
                "name": "Firebird",
                "role": "Critical Systems Monitor",
                "description": "Safety and emergency response management"
            }
        ],
        "stats": {
            "equipment_monitored": 47,
            "uptime_percentage": 96.3,
            "predictions_accurate": 87.5,
            "incidents_prevented": 142
        }
    }