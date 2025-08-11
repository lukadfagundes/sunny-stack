from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from ..utils.debug_helper import debug_decorator, debug_api

router = APIRouter()

class Project(BaseModel):
    name: str
    client: str
    description: Optional[str] = None
    status: str = "pending"

class ProjectUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    notes: Optional[str] = None

projects_db: Dict[str, Dict[str, Any]] = {}

@router.post("/create")
@debug_decorator("API")
async def create_project(project: Project):
    """Create a new project"""
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    
    project_data = {
        "id": project_id,
        "name": project.name,
        "client": project.client,
        "description": project.description,
        "status": project.status,
        "progress": 0,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "commits": 0,
        "files": 0,
        "duration": "0h"
    }
    
    projects_db[project_id] = project_data
    
    debug_api("Project created", project_id=project_id, client=project.client)
    
    return project_data

@router.get("/list")
@debug_decorator("API")
async def list_projects():
    """List all projects"""
    projects = list(projects_db.values())
    debug_api("Projects listed", count=len(projects))
    return {"projects": projects}

@router.get("/{project_id}")
@debug_decorator("API")
async def get_project(project_id: str):
    """Get project details"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    debug_api("Project retrieved", project_id=project_id)
    return projects_db[project_id]

@router.put("/{project_id}")
@debug_decorator("API")
async def update_project(project_id: str, update: ProjectUpdate):
    """Update project status"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects_db[project_id]
    
    if update.status:
        project["status"] = update.status
    if update.progress is not None:
        project["progress"] = update.progress
    if update.notes:
        project["notes"] = update.notes
    
    project["updated_at"] = datetime.now().isoformat()
    
    debug_api("Project updated", project_id=project_id, updates=update.dict(exclude_unset=True))
    
    return project

@router.delete("/{project_id}")
@debug_decorator("API")
async def delete_project(project_id: str):
    """Delete a project"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    del projects_db[project_id]
    
    debug_api("Project deleted", project_id=project_id)
    
    return {"message": "Project deleted successfully", "project_id": project_id}