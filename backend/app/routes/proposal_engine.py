from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid

from ..utils.debug_helper import debug_decorator, debug_proposal

router = APIRouter()

class ProposalRequest(BaseModel):
    client_name: str
    project_name: str
    analysis_id: Optional[str] = None
    requirements: List[str] = []
    timeline_preference: str = "standard"

@router.post("/generate")
@debug_decorator("PROPOSAL")
async def generate_proposal(request: ProposalRequest):
    """Generate AI-powered client proposal"""
    debug_proposal("Generating proposal",
                  client=request.client_name,
                  requirements_count=len(request.requirements))
    
    proposal_id = f"prop_{uuid.uuid4().hex[:8]}"
    
    proposal = {
        "proposal_id": proposal_id,
        "client": request.client_name,
        "project": request.project_name,
        "generated_at": datetime.now().isoformat(),
        "valid_until": (datetime.now() + timedelta(days=30)).isoformat(),
        
        "executive_summary": {
            "title": f"Digital Transformation Proposal for {request.client_name}",
            "overview": f"""
We are pleased to present this comprehensive proposal for {request.client_name}'s {request.project_name} initiative. 
Leveraging our AI-powered development methodology, we will deliver enterprise-grade solutions 10x faster than traditional approaches.

Our unique Trinity System combines:
• Claude Web for strategic architecture and planning
• Claude Code for overnight development execution  
• Anthropic API for intelligent automation

This approach enables us to deliver in weeks what traditionally takes months, while maintaining the highest quality standards.
""",
            "key_benefits": [
                "10x faster delivery compared to traditional development",
                "50% cost reduction through AI automation",
                "100% code ownership with zero vendor lock-in",
                "Enterprise-grade quality with comprehensive testing",
                "Clean handover with complete documentation"
            ]
        },
        
        "technical_approach": {
            "methodology": "AI-Powered Agile Development",
            "phases": [
                {
                    "phase": "Discovery & Analysis",
                    "duration": "3 days",
                    "activities": [
                        "Comprehensive system analysis",
                        "Requirements gathering",
                        "Architecture design",
                        "Risk assessment"
                    ]
                },
                {
                    "phase": "Development Sprint",
                    "duration": "2 weeks",
                    "activities": [
                        "Core feature implementation",
                        "API development",
                        "Database optimization",
                        "Frontend development"
                    ]
                },
                {
                    "phase": "Testing & Optimization",
                    "duration": "1 week",
                    "activities": [
                        "Automated testing",
                        "Performance optimization",
                        "Security hardening",
                        "User acceptance testing"
                    ]
                },
                {
                    "phase": "Deployment & Handover",
                    "duration": "3 days",
                    "activities": [
                        "Production deployment",
                        "Documentation delivery",
                        "Knowledge transfer",
                        "Support setup"
                    ]
                }
            ],
            "technologies": {
                "frontend": ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"],
                "backend": ["Python", "FastAPI", "PostgreSQL", "Redis"],
                "infrastructure": ["AWS/GCP", "Docker", "Kubernetes", "CI/CD"],
                "ai_tools": ["Claude Web", "Claude Code", "Anthropic API"]
            }
        },
        
        "timeline": {
            "total_duration": "4 weeks",
            "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=35)).isoformat(),
            "milestones": [
                {
                    "week": 1,
                    "deliverable": "System Analysis & Architecture Design",
                    "completion": "25%"
                },
                {
                    "week": 2,
                    "deliverable": "Core Features & Backend APIs",
                    "completion": "50%"
                },
                {
                    "week": 3,
                    "deliverable": "Frontend & Integration",
                    "completion": "75%"
                },
                {
                    "week": 4,
                    "deliverable": "Testing, Deployment & Handover",
                    "completion": "100%"
                }
            ]
        },
        
        "investment": {
            "total": "$45,000",
            "currency": "USD",
            "payment_terms": "50% upfront, 50% on completion",
            "breakdown": {
                "discovery_analysis": "$5,000",
                "development": "$25,000",
                "testing_optimization": "$10,000",
                "deployment_support": "$5,000"
            },
            "optional_services": {
                "extended_support": "$5,000/month",
                "performance_monitoring": "$2,000/month",
                "continuous_improvement": "$10,000/quarter"
            }
        },
        
        "deliverables": [
            "Complete source code with full ownership transfer",
            "Comprehensive technical documentation",
            "API documentation with Swagger/OpenAPI",
            "Deployment guides and runbooks",
            "Test suites with >80% coverage",
            "Performance benchmarks and reports",
            "Security audit report",
            "30-day post-launch support"
        ],
        
        "success_metrics": {
            "performance": "< 200ms average response time",
            "availability": "99.9% uptime SLA",
            "scalability": "Support for 10,000+ concurrent users",
            "quality": "> 80% test coverage",
            "security": "OWASP Top 10 compliant"
        },
        
        "why_sunny": [
            "Proven track record of delivering enterprise solutions",
            "AI-powered development for unprecedented speed",
            "Full transparency with real-time progress monitoring",
            "Clean code with no vendor lock-in",
            "Comprehensive documentation and knowledge transfer",
            "Post-launch support and maintenance options"
        ],
        
        "next_steps": [
            "Review and approve proposal",
            "Sign service agreement",
            "Kickoff meeting to finalize requirements",
            "Begin discovery phase"
        ]
    }
    
    debug_proposal("Proposal generated",
                  proposal_id=proposal_id,
                  total_investment=proposal["investment"]["total"])
    
    return proposal

@router.get("/list")
@debug_decorator("PROPOSAL")
async def list_proposals():
    """List all generated proposals"""
    debug_proposal("Listing proposals")
    
    proposals = [
        {
            "proposal_id": "prop_abc123",
            "client": "TechCorp Inc",
            "project": "Digital Transformation",
            "created": datetime.now().isoformat(),
            "status": "pending",
            "value": "$45,000"
        },
        {
            "proposal_id": "prop_def456",
            "client": "StartupXYZ",
            "project": "MVP Development",
            "created": (datetime.now() - timedelta(days=5)).isoformat(),
            "status": "accepted",
            "value": "$25,000"
        }
    ]
    
    return {"proposals": proposals, "total": len(proposals)}

@router.get("/{proposal_id}")
@debug_decorator("PROPOSAL")
async def get_proposal(proposal_id: str):
    """Get specific proposal details"""
    debug_proposal("Retrieving proposal", proposal_id=proposal_id)
    
    return {
        "proposal_id": proposal_id,
        "status": "active",
        "download_url": f"/api/proposals/download/{proposal_id}"
    }