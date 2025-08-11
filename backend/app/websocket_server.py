import socketio
import asyncio
from datetime import datetime
import json
import re
from typing import Dict, Any
from .utils.debug_helper import debug

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",  # Add support for port 3002
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",  # Add support for 127.0.0.1:3002
        "https://sunny-stack.com"
    ],
    logger=True,
    engineio_logger=False,
    async_mode='asgi'
)

class SunnyWebSocketManager:
    def __init__(self):
        self.active_sessions = {}
        self.claude_code_builds = {}
        self.project_updates = {}
        debug("WEBSOCKET", "Manager initialized with updated CORS", status="READY")
    
    async def connect_client(self, sid, environ):
        """Handle client connection"""
        debug("WEBSOCKET", f"Client connected", session_id=sid[:8])
        self.active_sessions[sid] = {
            "connected_at": datetime.now(),
            "last_activity": datetime.now(),
            "session_type": "trinity_interface"
        }
        
        # Send welcome message
        await sio.emit('connection_status', {
            'status': 'connected',
            'session_id': sid,
            'timestamp': datetime.now().isoformat()
        }, room=sid)
        
        return True
    
    async def disconnect_client(self, sid):
        """Handle client disconnection"""
        debug("WEBSOCKET", f"Client disconnected", session_id=sid[:8])
        if sid in self.active_sessions:
            del self.active_sessions[sid]
    
    async def handle_claude_code_execution(self, sid, data):
        """Handle Claude Code execution requests"""
        debug("WEBSOCKET", "Claude Code execution requested", 
              prompt_length=len(data.get('prompt', '')))
        
        build_id = f"build_{datetime.now().timestamp()}"
        self.claude_code_builds[build_id] = {
            'status': 'queued',
            'prompt': data.get('prompt', ''),
            'session_id': sid,
            'started_at': datetime.now()
        }
        
        # Emit build started
        await sio.emit('claude_code_status', {
            'build_id': build_id,
            'status': 'started',
            'message': 'Claude Code execution initiated'
        }, room=sid)
        
        # Simulate Claude Code execution
        await self.simulate_claude_code_execution(build_id, sid)
        
        return build_id
    
    async def simulate_claude_code_execution(self, build_id, sid):
        """Simulate Claude Code execution with progress updates"""
        stages = [
            ("analyzing", "Analyzing prompt requirements", "🔍"),
            ("planning", "Creating implementation plan", "📋"),
            ("coding", "Generating code components", "⚡"),
            ("testing", "Running automated tests", "🧪"),
            ("finalizing", "Finalizing implementation", "🔧"),
            ("complete", "Build completed successfully", "✅")
        ]
        
        for i, (stage, message, emoji) in enumerate(stages):
            await asyncio.sleep(2)  # Simulate work
            
            progress = int((i + 1) / len(stages) * 100)
            
            await sio.emit('claude_code_progress', {
                'build_id': build_id,
                'stage': stage,
                'message': f"{emoji} {message}",
                'progress': progress,
                'timestamp': datetime.now().isoformat()
            }, room=sid)
            
            debug("WEBSOCKET", f"Claude Code progress", 
                  stage=stage, progress=f"{progress}%")
        
        # Mark as complete
        self.claude_code_builds[build_id]['status'] = 'complete'
        self.claude_code_builds[build_id]['completed_at'] = datetime.now()
    
    async def handle_project_update(self, sid, data):
        """Handle project status updates"""
        project_id = data.get('project_id')
        update = data.get('update', {})
        
        debug("WEBSOCKET", "Project update", 
              project_id=project_id, update_type=update.get('type'))
        
        # Broadcast to all connected clients
        await sio.emit('project_update', {
            'project_id': project_id,
            'update': update,
            'timestamp': datetime.now().isoformat()
        })

# Initialize WebSocket manager
ws_manager = SunnyWebSocketManager()

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    return await ws_manager.connect_client(sid, environ)

@sio.event
async def disconnect(sid):
    await ws_manager.disconnect_client(sid)

@sio.event
async def claude_code_execute(sid, data):
    build_id = await ws_manager.handle_claude_code_execution(sid, data)
    return {'build_id': build_id, 'status': 'queued'}

@sio.event
async def project_update(sid, data):
    await ws_manager.handle_project_update(sid, data)

@sio.event
async def ping(sid, data):
    await sio.emit('pong', {'timestamp': datetime.now().isoformat()}, room=sid)

def create_socketio_app(fastapi_app):
    """Integrate Socket.IO with FastAPI"""
    return socketio.ASGIApp(sio, fastapi_app)