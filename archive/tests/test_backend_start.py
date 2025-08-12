#!/usr/bin/env python
"""Start the Sunny backend with new MCP authentication"""

import sys
import os
import uvicorn

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

if __name__ == "__main__":
    print("[INFO] Starting Sunny backend with MCP authentication...")
    print("[INFO] API Key: Check backend/.claude_mcp_key.txt")
    print("[INFO] Public endpoints:")
    print("  - http://localhost:8000/api/mcp/debug/public-status")
    print("  - http://localhost:8000/api/mcp/debug/test-connectivity")
    print("[INFO] Starting server on http://localhost:8000...")
    
    # Start the server
    uvicorn.run(
        "app.main:asgi_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )