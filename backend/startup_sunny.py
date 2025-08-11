#!/usr/bin/env python3
"""
Sunny Startup Script with Debug-Heavy Methodology
Validates environment and starts the backend server
"""

import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime

def debug(category: str, description: str, **kwargs):
    """Debug logging for startup"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {description} - {metrics} [{timestamp}]")

def main():
    """Main startup sequence"""
    print("\n" + "="*60)
    print("SUNNY BACKEND STARTUP SEQUENCE")
    print("="*60 + "\n")
    
    debug("STARTUP", "Initiating Sunny startup sequence")
    
    # Step 1: Validate environment
    debug("STARTUP", "Running environment validation")
    validation_result = subprocess.run(
        [sys.executable, "validate_environment.py"],
        capture_output=True,
        text=True
    )
    
    if validation_result.returncode != 0:
        debug("ERROR", "Environment validation failed")
        print("\n[ERROR] Environment validation failed!")
        print("Run 'python install_dependencies.py' to fix issues")
        return False
    
    debug("SUCCESS", "Environment validation passed")
    
    # Step 2: Run health check
    debug("STARTUP", "Running dependency health check")
    health_result = subprocess.run(
        [sys.executable, "monitor_dependencies.py"],
        capture_output=True,
        text=True
    )
    
    if health_result.returncode != 0:
        debug("WARNING", "Health check reported issues but continuing")
    else:
        debug("SUCCESS", "Dependency health check passed")
    
    # Step 3: Start the backend
    print("\n" + "="*60)
    print("STARTING SUNNY BACKEND SERVER")
    print("="*60 + "\n")
    
    debug("STARTUP", "Launching Sunny backend on port 8000")
    print("\n[INFO] Starting Sunny backend with ASGI app for full features...")
    print("[INFO] Access the API at: http://localhost:8000")
    print("[INFO] API Documentation: http://localhost:8000/docs")
    print("[INFO] Press Ctrl+C to stop the server\n")
    
    try:
        # Start uvicorn with the ASGI app
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "app.main:asgi_app",
            "--reload",
            "--port", "8000",
            "--host", "0.0.0.0"
        ])
    except KeyboardInterrupt:
        debug("SHUTDOWN", "Server stopped by user")
        print("\n[INFO] Sunny backend shutdown complete")
    except Exception as e:
        debug("ERROR", f"Server startup failed: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    os.chdir(Path(__file__).parent)  # Ensure we're in backend directory
    success = main()
    sys.exit(0 if success else 1)