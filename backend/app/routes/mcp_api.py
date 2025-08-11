from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional
from datetime import datetime
import json

from ..services.mcp_service import mcp_service, mcp_tools
from ..utils.debug_helper import debug, debug_decorator

router = APIRouter()

@router.get("/status")
@debug_decorator("MCP")
async def get_mcp_status():
    """Get current MCP service status"""
    print("DEBUG MCP API: Status check requested")
    
    try:
        # Simplified status response for debugging
        basic_status = {
            "service": "MCP Connector",
            "status": "operational",
            "connection": {
                "protocol": "MCP",
                "version": "1.0.0",
                "enabled": True
            },
            "timestamp": datetime.now().isoformat(),
            "capabilities": [
                "debug_logs",
                "system_monitoring", 
                "file_access",
                "project_structure",
                "error_analysis",
                "performance_monitoring"
            ]
        }
        
        # Try to get full status, but return basic if it fails
        try:
            status = await mcp_tools.get_system_status()
            basic_status["health"] = status
        except Exception as inner_e:
            print(f"DEBUG MCP API: Error getting full status: {str(inner_e)}")
            basic_status["health"] = {
                "status": "partial",
                "error": str(inner_e)
            }
        
        return basic_status
        
    except Exception as e:
        print(f"DEBUG MCP API: Critical error in status endpoint: {str(e)}")
        debug("ERROR", f"MCP status check failed: {str(e)}")
        # Return minimal response instead of raising exception
        return {
            "service": "MCP Connector",
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/logs")
@debug_decorator("MCP")
async def get_debug_logs(
    count: int = 50,
    category: Optional[str] = None,
    level: Optional[str] = None
):
    """Get debug logs from MCP service"""
    print(f"DEBUG MCP API: Fetching logs - count={count}, category={category}, level={level}")
    
    try:
        logs = await mcp_tools.get_debug_logs(count, category, level)
        await mcp_service.log_debug_entry("MCP", "Debug logs accessed via API", 
                                         count=count, filters={"category": category, "level": level})
        return logs
    except Exception as e:
        debug("ERROR", f"Failed to fetch logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/project/structure")
@debug_decorator("MCP")
async def get_project_structure(max_depth: int = 3):
    """Get project directory structure"""
    print(f"DEBUG MCP API: Fetching project structure - max_depth={max_depth}")
    
    try:
        structure = await mcp_tools.list_project_structure(max_depth)
        await mcp_service.log_debug_entry("MCP", "Project structure accessed", max_depth=max_depth)
        return structure
    except Exception as e:
        debug("ERROR", f"Failed to get project structure: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/project/file")
@debug_decorator("MCP")
async def read_project_file(file_path: str):
    """Read a specific project file"""
    print(f"DEBUG MCP API: Reading file - {file_path}")
    
    try:
        file_data = await mcp_tools.read_project_file(file_path)
        return file_data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        debug("ERROR", f"Failed to read file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/errors/analysis")
@debug_decorator("MCP")
async def analyze_errors(timeframe_minutes: int = 30):
    """Analyze recent error patterns"""
    print(f"DEBUG MCP API: Analyzing errors - timeframe={timeframe_minutes} minutes")
    
    try:
        analysis = await mcp_tools.analyze_error_patterns(timeframe_minutes)
        await mcp_service.log_debug_entry("MCP", "Error analysis performed", 
                                         timeframe_minutes=timeframe_minutes,
                                         total_errors=analysis['total_errors'])
        return analysis
    except Exception as e:
        debug("ERROR", f"Error analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/monitor")
@debug_decorator("MCP")
async def monitor_performance(duration_seconds: int = 30, background_tasks: BackgroundTasks = None):
    """Start performance monitoring"""
    print(f"DEBUG MCP API: Starting performance monitoring - duration={duration_seconds} seconds")
    
    if duration_seconds > 60:
        raise HTTPException(status_code=400, detail="Duration cannot exceed 60 seconds")
    
    try:
        # Run performance monitoring in background
        if background_tasks:
            background_tasks.add_task(mcp_tools.monitor_performance, duration_seconds)
            
            await mcp_service.log_debug_entry("MCP", "Performance monitoring started", 
                                             duration_seconds=duration_seconds)
            
            return {
                "status": "monitoring_started",
                "duration_seconds": duration_seconds,
                "message": "Performance monitoring initiated in background"
            }
        else:
            # Run synchronously if no background tasks
            performance_data = await mcp_tools.monitor_performance(duration_seconds)
            return performance_data
            
    except Exception as e:
        debug("ERROR", f"Performance monitoring failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/execute")
@debug_decorator("MCP") 
async def execute_mcp_tool(tool_name: str, parameters: Dict[str, Any] = {}):
    """Execute a specific MCP tool with Claude access"""
    print(f"DEBUG MCP API: Executing tool - {tool_name}")
    
    allowed_tools = {
        "get_debug_logs": mcp_tools.get_debug_logs,
        "get_system_status": mcp_tools.get_system_status,
        "read_project_file": mcp_tools.read_project_file,
        "list_project_structure": mcp_tools.list_project_structure,
        "analyze_error_patterns": mcp_tools.analyze_error_patterns,
        "monitor_performance": mcp_tools.monitor_performance
    }
    
    if tool_name not in allowed_tools:
        raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")
    
    try:
        # Execute the tool with provided parameters
        tool_function = allowed_tools[tool_name]
        result = await tool_function(**parameters)
        
        await mcp_service.log_debug_entry("MCP", f"Tool executed: {tool_name}", 
                                         parameters=parameters)
        
        return {
            "tool": tool_name,
            "executed_at": datetime.now().isoformat(),
            "result": result
        }
        
    except TypeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        debug("ERROR", f"Tool execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
@debug_decorator("MCP")
async def health_check():
    """MCP service health check"""
    print("DEBUG MCP API: Health check")
    
    try:
        health = await mcp_tools.get_system_status()
        
        return {
            "status": "healthy" if health['health'] == 'healthy' else "degraded",
            "timestamp": datetime.now().isoformat(),
            "metrics": health['metrics'],
            "debug_activity": health['debug_activity']
        }
    except Exception as e:
        debug("ERROR", f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@router.post("/log")
@debug_decorator("MCP")
async def add_log_entry(category: str, description: str, metrics: Dict[str, Any] = {}):
    """Add a log entry to MCP service"""
    print(f"DEBUG MCP API: Adding log entry - category={category}")
    
    try:
        await mcp_service.log_debug_entry(category, description, **metrics)
        
        return {
            "status": "logged",
            "timestamp": datetime.now().isoformat(),
            "category": category,
            "description": description
        }
    except Exception as e:
        debug("ERROR", f"Failed to add log entry: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))