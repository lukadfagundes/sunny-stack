#!/usr/bin/env python
"""Test MCP endpoint directly"""

import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi import Request
from app.routes.mcp_api import get_mcp_auth
from app.services.api_key_manager import api_key_manager

async def test_auth():
    """Test the MCP authentication function"""
    
    # Create mock request
    class MockClient:
        host = "127.0.0.1"
    
    class MockRequest:
        method = "GET"
        client = MockClient()
        headers = {
            "X-API-Key": "QIWmnmR50_jDNa_iKzdbz6bsCYvIZKDEkz0JLRKFDP0"
        }
        
        class url:
            path = "/api/mcp/status"
    
    request = MockRequest()
    
    try:
        # Test API key validation directly
        print("Testing API key validation...")
        key_result = api_key_manager.validate_key(request.headers["X-API-Key"])
        if key_result:
            print(f"[OK] API key is valid: {key_result['name']}")
        else:
            print("[ERROR] API key validation failed")
        
        # Test get_mcp_auth
        print("\nTesting get_mcp_auth function...")
        auth_result = await get_mcp_auth(
            request=request,
            x_api_key=request.headers["X-API-Key"],
            authorization=None
        )
        print(f"[SUCCESS] Auth result: {auth_result}")
        
    except Exception as e:
        print(f"[ERROR] Exception: {e}")
        import traceback
        traceback.print_exc()

# Run the test
asyncio.run(test_auth())