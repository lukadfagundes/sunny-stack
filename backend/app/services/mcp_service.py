import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import uuid
import os
import subprocess
from pathlib import Path

from ..utils.debug_helper import debug

class SunnyMCPService:
    """Internal MCP service for exposing Sunny development environment to Claude"""
    
    def __init__(self):
        self.debug_logs: List[Dict] = []
        self.max_logs = 1000
        self.project_root = Path(__file__).parent.parent.parent.parent  # Navigate to Sunny root
        self.active_sessions: Dict[str, Dict] = {}
        
    async def start_service(self):
        """Initialize the MCP service"""
        print(f"DEBUG MCP: Starting Sunny MCP service - Project root: {self.project_root}")
        
        # Start background tasks
        asyncio.create_task(self._monitor_system_health())
        print("DEBUG MCP: MCP service started successfully")
        
    async def log_debug_entry(self, category: str, description: str, **kwargs):
        """Capture debug logs for MCP access"""
        log_entry = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'category': category,
            'description': description,
            'metrics': kwargs,
            'level': self._determine_log_level(category, description)
        }
        
        self.debug_logs.append(log_entry)
        
        # Maintain max log limit
        if len(self.debug_logs) > self.max_logs:
            self.debug_logs = self.debug_logs[-self.max_logs:]
    
    def _determine_log_level(self, category: str, description: str) -> str:
        """Determine log level based on category and description"""
        if category == "ERROR" or "error" in description.lower():
            return "error"
        elif "warning" in description.lower() or "slow" in description.lower():
            return "warning"
        else:
            return "info"
    
    async def _monitor_system_health(self):
        """Background task to monitor system health"""
        while True:
            try:
                # Check system metrics every 30 seconds
                health_data = await self._collect_health_metrics()
                await self.log_debug_entry("MCP", "System health check completed", **health_data)
                await asyncio.sleep(30)
            except Exception as e:
                await self.log_debug_entry("ERROR", f"Health monitoring failed: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error
    
    async def _collect_health_metrics(self) -> Dict:
        """Collect current system health metrics"""
        try:
            import psutil
            
            return {
                'cpu_percent': psutil.cpu_percent(),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:\\').percent,
                'active_connections': len(self.active_sessions),
                'debug_logs_count': len(self.debug_logs),
                'recent_errors': len([log for log in self.debug_logs 
                                    if log['level'] == 'error' 
                                    and datetime.fromisoformat(log['timestamp']) > datetime.now() - timedelta(minutes=5)])
            }
        except (ImportError, Exception) as e:
            # Fallback if psutil not installed or any error occurs
            print(f"DEBUG MCP: Health metrics collection error: {str(e)}")
            return {
                'cpu_percent': 0,
                'memory_percent': 0,
                'disk_percent': 0,
                'active_connections': len(self.active_sessions),
                'debug_logs_count': len(self.debug_logs),
                'recent_errors': len([log for log in self.debug_logs 
                                    if log.get('level') == 'error' 
                                    and datetime.fromisoformat(log['timestamp']) > datetime.now() - timedelta(minutes=5)])
                if self.debug_logs else 0
            }

# MCP Tool Handlers - These will be exposed to Claude
class SunnyMCPTools:
    """MCP tool implementations for Sunny environment access"""
    
    def __init__(self, mcp_service: SunnyMCPService):
        self.mcp_service = mcp_service
    
    async def get_debug_logs(self, count: int = 50, category: Optional[str] = None, 
                           level: Optional[str] = None) -> Dict:
        """Get recent debug logs with optional filtering"""
        logs = self.mcp_service.debug_logs
        
        # Apply filters
        if category:
            logs = [log for log in logs if log['category'] == category]
        if level:
            logs = [log for log in logs if log['level'] == level]
        
        # Get recent logs
        recent_logs = logs[-count:] if count else logs
        
        return {
            'total_logs': len(self.mcp_service.debug_logs),
            'filtered_logs': len(logs),
            'returned_logs': len(recent_logs),
            'logs': recent_logs,
            'summary': {
                'errors': len([log for log in recent_logs if log['level'] == 'error']),
                'warnings': len([log for log in recent_logs if log['level'] == 'warning']),
                'categories': self._count_categories(recent_logs)
            }
        }
    
    async def get_system_status(self) -> Dict:
        """Get current system status and health metrics"""
        health_metrics = await self.mcp_service._collect_health_metrics()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'health': 'healthy' if health_metrics['recent_errors'] == 0 else 'issues_detected',
            'uptime_hours': (datetime.now() - datetime.now().replace(hour=0, minute=0, second=0)).total_seconds() / 3600,
            'metrics': health_metrics,
            'debug_activity': {
                'total_logs': len(self.mcp_service.debug_logs),
                'recent_activity': len([log for log in self.mcp_service.debug_logs 
                                      if datetime.fromisoformat(log['timestamp']) > datetime.now() - timedelta(minutes=10)])
            }
        }
    
    async def read_project_file(self, file_path: str) -> Dict:
        """Read a file from the Sunny project"""
        try:
            full_path = self.mcp_service.project_root / file_path
            
            # Security check
            if not str(full_path).startswith(str(self.mcp_service.project_root)):
                raise ValueError("Path outside project directory")
            
            if not full_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            content = full_path.read_text(encoding='utf-8')
            stat = full_path.stat()
            
            await self.mcp_service.log_debug_entry("MCP", f"File read via MCP", file_path=file_path, size=len(content))
            
            return {
                'file_path': file_path,
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'content': content
            }
            
        except Exception as e:
            await self.mcp_service.log_debug_entry("ERROR", f"MCP file read failed: {str(e)}", file_path=file_path)
            raise
    
    async def list_project_structure(self, max_depth: int = 3) -> Dict:
        """Get project directory structure"""
        def scan_directory(path: Path, current_depth: int) -> Dict:
            if current_depth > max_depth:
                return {"...": "max_depth_reached"}
            
            structure = {}
            try:
                for item in path.iterdir():
                    if item.name.startswith('.') and item.name not in ['.env', '.env.example']:
                        continue
                    if item.name in ['node_modules', '__pycache__', 'venv', '.git']:
                        continue
                    
                    if item.is_dir():
                        structure[f"{item.name}/"] = scan_directory(item, current_depth + 1)
                    else:
                        stat = item.stat()
                        structure[item.name] = {
                            'size': stat.st_size,
                            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                        }
            except PermissionError:
                structure['error'] = 'Permission denied'
            
            return structure
        
        structure = scan_directory(self.mcp_service.project_root, 0)
        
        await self.mcp_service.log_debug_entry("MCP", "Project structure accessed via MCP", max_depth=max_depth)
        
        return {
            'project_root': str(self.mcp_service.project_root),
            'max_depth': max_depth,
            'structure': structure
        }
    
    async def analyze_error_patterns(self, timeframe_minutes: int = 30) -> Dict:
        """Analyze recent error patterns"""
        cutoff_time = datetime.now() - timedelta(minutes=timeframe_minutes)
        
        recent_errors = [
            log for log in self.mcp_service.debug_logs
            if log['level'] == 'error' 
            and datetime.fromisoformat(log['timestamp']) > cutoff_time
        ]
        
        return {
            'timeframe_minutes': timeframe_minutes,
            'total_errors': len(recent_errors),
            'error_categories': self._count_categories([log for log in recent_errors]),
            'common_descriptions': self._count_descriptions(recent_errors),
            'error_timeline': [
                {
                    'timestamp': log['timestamp'],
                    'category': log['category'],
                    'description': log['description'],
                    'metrics': log['metrics']
                }
                for log in recent_errors
            ]
        }
    
    async def monitor_performance(self, duration_seconds: int = 30) -> Dict:
        """Monitor performance metrics for specified duration"""
        start_time = datetime.now()
        performance_data = []
        
        await self.mcp_service.log_debug_entry("MCP", f"Starting performance monitoring", duration_seconds=duration_seconds)
        
        for i in range(min(duration_seconds, 60)):  # Max 60 seconds
            metrics = await self.mcp_service._collect_health_metrics()
            performance_data.append({
                'timestamp': datetime.now().isoformat(),
                'metrics': metrics
            })
            await asyncio.sleep(1)
        
        # Calculate averages
        if performance_data:
            avg_cpu = sum(d['metrics']['cpu_percent'] for d in performance_data) / len(performance_data)
            avg_memory = sum(d['metrics']['memory_percent'] for d in performance_data) / len(performance_data)
        else:
            avg_cpu = 0
            avg_memory = 0
        
        return {
            'monitoring_duration': duration_seconds,
            'start_time': start_time.isoformat(),
            'end_time': datetime.now().isoformat(),
            'averages': {
                'cpu_percent': round(avg_cpu, 2),
                'memory_percent': round(avg_memory, 2)
            },
            'detailed_data': performance_data
        }
    
    def _count_categories(self, logs: List[Dict]) -> Dict[str, int]:
        """Count log entries by category"""
        categories = {}
        for log in logs:
            category = log['category']
            categories[category] = categories.get(category, 0) + 1
        return categories
    
    def _count_descriptions(self, logs: List[Dict]) -> Dict[str, int]:
        """Count log entries by description"""
        descriptions = {}
        for log in logs:
            desc = log['description']
            descriptions[desc] = descriptions.get(desc, 0) + 1
        return dict(sorted(descriptions.items(), key=lambda x: x[1], reverse=True)[:10])  # Top 10

# Global instances
mcp_service = SunnyMCPService()
mcp_tools = SunnyMCPTools(mcp_service)