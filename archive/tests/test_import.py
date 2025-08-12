#!/usr/bin/env python
"""Test imports for new MCP authentication modules"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    print("Testing imports...")
    
    # Test API key manager
    from app.services.api_key_manager import api_key_manager
    print("[OK] api_key_manager imported successfully")
    
    # Test MCP auth debug
    from app.services.mcp_auth_debug import mcp_auth_debugger
    print("[OK] mcp_auth_debugger imported successfully")
    
    # Test MCP debug endpoints
    from app.routes.mcp_debug_endpoints import router
    print("[OK] mcp_debug_endpoints imported successfully")
    
    # Test main app
    from app.main import app
    print("[OK] main app imported successfully")
    
    print("\n[SUCCESS] All imports successful! MCP authentication modules are ready.")
    
    # Check for Claude API key
    keys = api_key_manager.list_keys()
    claude_key_exists = any(k["name"] == "claude_ai_mcp" for k in keys)
    if claude_key_exists:
        print("\n[INFO] Claude.ai MCP API key exists")
        print("   Check backend/.claude_mcp_key.txt for the key")
    else:
        print("\n[WARNING] No Claude.ai MCP API key found")
    
except ImportError as e:
    print(f"\n[ERROR] Import error: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"\n[ERROR] Error: {e}")
    import traceback
    traceback.print_exc()