from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import anthropic
import os
from datetime import datetime

from ..services.claude_orchestrator import ClaudeCodeOrchestrator
from ..utils.debug_helper import debug_decorator, debug_claude, debug_api

router = APIRouter()
orchestrator = ClaudeCodeOrchestrator()

class ChatMessage(BaseModel):
    message: str
    conversation: List[Dict[str, Any]] = []
    projectContext: Optional[str] = None

class ClaudeCodePrompt(BaseModel):
    prompt: str
    projectId: str = "default"

@router.post("/chat")
@debug_decorator("CLAUDE")
async def claude_chat(request: ChatMessage):
    """Handle Claude Web chat interactions"""
    debug_claude("Chat request received", message_length=len(request.message))
    
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        messages = []
        for msg in request.conversation:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",  # Using Sonnet 3.5 (best available via API)
            max_tokens=4000,
            messages=messages,
            system="You are Claude, integrated into the Sunny AI consulting platform. You provide strategic guidance, architectural advice, and generate comprehensive Claude Code artifacts for software development projects. Focus on business value, technical excellence, and creating actionable artifacts that can be directly used in Claude Code."
        )
        
        artifacts = []
        # Properly extract content based on response structure
        if hasattr(response, 'content') and response.content:
            if isinstance(response.content, list) and len(response.content) > 0:
                content = response.content[0].text
            elif isinstance(response.content, str):
                content = response.content
            else:
                content = str(response.content)
        else:
            content = "Response received but couldn't extract content."
        
        # Enhanced artifact extraction for Claude Code
        if "```" in content or "CLAUDE CODE" in content.upper():
            import re
            
            # Extract code blocks
            code_blocks = re.findall(r'```(\w+)?\n(.*?)```', content, re.DOTALL)
            for i, (lang, code) in enumerate(code_blocks):
                artifacts.append({
                    "id": f"artifact_{datetime.now().timestamp()}_{i}",
                    "title": f"Code: {lang.title() if lang else 'Implementation'}",
                    "type": lang or "code",
                    "content": code
                })
            
            # Extract Claude Code prompts
            claude_prompts = re.findall(r'(?:CLAUDE CODE PROMPT|Claude Code):\s*(.*?)(?=\n\n|\Z)', content, re.DOTALL | re.IGNORECASE)
            for i, prompt in enumerate(claude_prompts):
                if prompt.strip():
                    artifacts.append({
                        "id": f"claude_prompt_{datetime.now().timestamp()}_{i}",
                        "title": "Claude Code Prompt",
                        "type": "claude-prompt",
                        "content": prompt.strip()
                    })
        
        debug_claude("Chat response generated", 
                    model="claude-3-5-sonnet",
                    response_length=len(content),
                    artifacts_count=len(artifacts),
                    tokens=getattr(response.usage, 'total_tokens', 'unknown') if hasattr(response, 'usage') else 'N/A')
        
        return {
            "response": content,
            "artifacts": artifacts,
            "model_used": "claude-3-5-sonnet-20241022",
            "tokens_used": getattr(response.usage, 'total_tokens', 0) if hasattr(response, 'usage') else 0
        }
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        debug_claude("Chat error", error=str(e)[:200])
        print(f"DEBUG ERROR: Full error details:\n{error_detail}")
        
        # Try a simpler direct call with Sonnet
        try:
            simple_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            simple_response = simple_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{"role": "user", "content": request.message}]
            )
            return {
                "response": simple_response.content[0].text,
                "artifacts": []
            }
        except Exception as e2:
            debug_claude("Fallback also failed", error=str(e2))
            return {
                "response": f"I apologize, but I'm having trouble connecting to the AI service. Error: {str(e)[:100]}",
                "artifacts": []
            }

@router.post("/code/execute")
@debug_decorator("CLAUDE")
async def execute_claude_code(request: ClaudeCodePrompt):
    """Execute Claude Code with comprehensive prompt"""
    debug_claude("Code execution requested", 
                prompt_length=len(request.prompt),
                project_id=request.projectId)
    
    build_id, process = await orchestrator.execute_comprehensive_prompt(
        request.prompt,
        request.projectId
    )
    
    debug_api("Streaming build output", build_id=build_id)
    
    return StreamingResponse(
        orchestrator.stream_build_output(build_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Build-ID": build_id
        }
    )

@router.post("/code/stop")
@debug_decorator("CLAUDE")
async def stop_claude_code():
    """Stop active Claude Code execution"""
    debug_claude("Stop execution requested")
    
    for build_id in list(orchestrator.active_builds.keys()):
        build = orchestrator.active_builds[build_id]
        if build['status'] == 'running':
            success = await orchestrator.stop_build(build_id)
            if success:
                debug_claude("Build stopped", build_id=build_id)
                return {"status": "stopped", "build_id": build_id}
    
    return {"status": "no_active_builds"}

@router.get("/code/status/{build_id}")
@debug_decorator("CLAUDE")
async def get_build_status(build_id: str):
    """Get status of a specific build"""
    status = orchestrator.get_build_status(build_id)
    
    if status:
        debug_claude("Build status retrieved", build_id=build_id, status=status['status'])
        return status
    else:
        raise HTTPException(status_code=404, detail="Build not found")

@router.get("/code/active")
@debug_decorator("CLAUDE")
async def get_active_builds():
    """Get all active builds"""
    active = []
    for build_id, build in orchestrator.active_builds.items():
        if build['status'] == 'running':
            active.append({
                'build_id': build_id,
                'project_id': build['project_id'],
                'start_time': build['start_time'].isoformat(),
                'status': build['status']
            })
    
    debug_claude("Active builds retrieved", count=len(active))
    return {"active_builds": active}