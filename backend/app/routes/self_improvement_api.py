from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
from ..services.self_analysis import safe_self_improvement_orchestrator, self_analysis_engine
from ..routes.auth_routes import require_admin
from ..utils.debug_helper import debug

router = APIRouter()

class RejectProposalRequest(BaseModel):
    reason: str

@router.post("/analyze")
async def trigger_safe_self_analysis(current_user: Dict = Depends(require_admin)):
    """Trigger safe self-analysis that generates proposals instead of implementing changes"""
    try:
        await debug("API", "Safe self-analysis triggered", admin=current_user["email"])
        result = await safe_self_improvement_orchestrator.perform_self_analysis_and_propose()
        return result
    except Exception as e:
        await debug("ERROR", f"Safe self-analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/proposals")
async def get_pending_proposals(current_user: Dict = Depends(require_admin)):
    """Get all pending improvement proposals"""
    try:
        proposals = await safe_self_improvement_orchestrator.get_pending_proposals()
        return {"proposals": proposals}
    except Exception as e:
        await debug("ERROR", f"Get proposals failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proposals/{proposal_id}/approve")
async def approve_proposal(
    proposal_id: str, 
    current_user: Dict = Depends(require_admin)
):
    """Approve a proposal for implementation"""
    try:
        result = await safe_self_improvement_orchestrator.approve_proposal(
            proposal_id, current_user["email"]
        )
        return result
    except Exception as e:
        await debug("ERROR", f"Approve proposal failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proposals/{proposal_id}/reject")
async def reject_proposal(
    proposal_id: str,
    request: RejectProposalRequest,
    current_user: Dict = Depends(require_admin)
):
    """Reject a proposal"""
    try:
        result = await safe_self_improvement_orchestrator.reject_proposal(
            proposal_id, current_user["email"], request.reason
        )
        return result
    except Exception as e:
        await debug("ERROR", f"Reject proposal failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def get_proposal_dashboard(current_user: Dict = Depends(require_admin)):
    """Get proposal management dashboard data"""
    try:
        dashboard_data = await safe_self_improvement_orchestrator.get_proposal_dashboard_data()
        return dashboard_data
    except Exception as e:
        await debug("ERROR", f"Get dashboard data failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_improvement_status():
    """Get current self-improvement status"""
    try:
        status = {
            "improvement_active": safe_self_improvement_orchestrator.analysis_active,
            "pending_proposals": len(safe_self_improvement_orchestrator.pending_proposals),
            "analysis_history": len(self_analysis_engine.analysis_history),
            "last_analysis": self_analysis_engine.analysis_history[-1]["timestamp"] if self_analysis_engine.analysis_history else None
        }
        return status
    except Exception as e:
        await debug("ERROR", f"Get improvement status failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_analysis_history():
    """Get analysis history"""
    try:
        return {
            "history": self_analysis_engine.analysis_history,
            "total_analyses": len(self_analysis_engine.analysis_history)
        }
    except Exception as e:
        await debug("ERROR", f"Get analysis history failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheduled")
async def get_scheduled_improvements():
    """Get scheduled improvements"""
    try:
        return {
            "approved": safe_self_improvement_orchestrator.approved_proposals,
            "total": len(safe_self_improvement_orchestrator.approved_proposals)
        }
    except Exception as e:
        await debug("ERROR", f"Get scheduled improvements failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))