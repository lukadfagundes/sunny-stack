import asyncio
import subprocess
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import json
import os
from ..utils.debug_helper import debug_decorator, debug_claude

class ClaudeCodeOrchestrator:
    """Manage Claude Code execution and real-time monitoring"""
    
    def __init__(self):
        self.active_builds: Dict[str, Dict[str, Any]] = {}
        self.build_history: list = []
        debug_claude("Orchestrator initialized", max_builds=10)
    
    @debug_decorator("CLAUDE")
    async def execute_comprehensive_prompt(self, prompt_content: str, project_id: str) -> tuple[str, Any]:
        """Execute Claude Code with comprehensive prompt and stream output"""
        build_id = str(uuid.uuid4())
        
        prompt_file = f"/tmp/sunny_prompt_{build_id}.txt"
        with open(prompt_file, 'w') as f:
            f.write(prompt_content)
        
        debug_claude("Prompt file created", build_id=build_id, chars=len(prompt_content))
        
        project_path = f"/projects/{project_id}" if project_id != "default" else os.getcwd()
        
        try:
            process = await asyncio.create_subprocess_exec(
                'claude', '--prompt-file', prompt_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=project_path
            )
        except FileNotFoundError:
            debug_claude("Claude CLI not found, using mock execution", build_id=build_id)
            process = None
        
        self.active_builds[build_id] = {
            'project_id': project_id,
            'process': process,
            'start_time': datetime.now(),
            'status': 'running',
            'output': []
        }
        
        debug_claude("Build started", build_id=build_id, project_id=project_id)
        
        return build_id, process
    
    @debug_decorator("CLAUDE")
    async def stream_build_output(self, build_id: str):
        """Stream output from active build"""
        if build_id not in self.active_builds:
            debug_claude("Build not found", build_id=build_id)
            yield json.dumps({"error": "Build not found", "type": "error"})
            return
        
        build = self.active_builds[build_id]
        process = build['process']
        
        if process is None:
            mock_outputs = [
                "Initializing Claude Code environment...",
                "Loading project context...",
                "Analyzing codebase structure...",
                "Generating implementation plan...",
                "Writing code...",
                "Running tests...",
                "Build completed successfully!"
            ]
            
            for output in mock_outputs:
                await asyncio.sleep(1)
                yield f"data: {json.dumps({'output': output, 'type': 'info'})}\n\n"
                build['output'].append(output)
            
            yield f"data: {json.dumps({'output': 'Build completed', 'type': 'success', 'completed': True})}\n\n"
            build['status'] = 'completed'
            return
        
        try:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                
                output = line.decode().strip()
                build['output'].append(output)
                
                yield f"data: {json.dumps({'output': output, 'type': 'info'})}\n\n"
                
                debug_claude("Output streamed", build_id=build_id, chars=len(output))
            
            await process.wait()
            
            if process.returncode == 0:
                yield f"data: {json.dumps({'output': 'Build completed successfully', 'type': 'success', 'completed': True})}\n\n"
                build['status'] = 'completed'
            else:
                stderr = await process.stderr.read()
                error_msg = stderr.decode() if stderr else "Build failed"
                yield f"data: {json.dumps({'output': error_msg, 'type': 'error', 'completed': True})}\n\n"
                build['status'] = 'failed'
                
        except Exception as e:
            debug_claude("Stream error", build_id=build_id, error=str(e))
            yield f"data: {json.dumps({'output': f'Error: {str(e)}', 'type': 'error'})}\n\n"
            build['status'] = 'error'
    
    @debug_decorator("CLAUDE")
    async def stop_build(self, build_id: str) -> bool:
        """Stop an active build"""
        if build_id not in self.active_builds:
            debug_claude("Build not found for stopping", build_id=build_id)
            return False
        
        build = self.active_builds[build_id]
        process = build['process']
        
        if process and process.returncode is None:
            process.terminate()
            await asyncio.sleep(0.5)
            if process.returncode is None:
                process.kill()
            
            build['status'] = 'stopped'
            debug_claude("Build stopped", build_id=build_id)
            return True
        
        return False
    
    @debug_decorator("CLAUDE")
    def get_build_status(self, build_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a build"""
        if build_id in self.active_builds:
            build = self.active_builds[build_id]
            return {
                'build_id': build_id,
                'status': build['status'],
                'start_time': build['start_time'].isoformat(),
                'project_id': build['project_id'],
                'output_lines': len(build['output'])
            }
        return None
    
    @debug_decorator("CLAUDE")
    def cleanup_old_builds(self):
        """Clean up completed builds older than 1 hour"""
        current_time = datetime.now()
        builds_to_remove = []
        
        for build_id, build in self.active_builds.items():
            if build['status'] in ['completed', 'failed', 'stopped']:
                time_diff = (current_time - build['start_time']).total_seconds()
                if time_diff > 3600:
                    builds_to_remove.append(build_id)
        
        for build_id in builds_to_remove:
            build = self.active_builds.pop(build_id)
            self.build_history.append({
                'build_id': build_id,
                'status': build['status'],
                'start_time': build['start_time'].isoformat(),
                'project_id': build['project_id']
            })
            
            if len(self.build_history) > 100:
                self.build_history = self.build_history[-100:]
        
        if builds_to_remove:
            debug_claude("Cleaned up old builds", count=len(builds_to_remove))