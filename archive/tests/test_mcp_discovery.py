#!/usr/bin/env python
"""Test the new MCP discovery endpoints"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_discovery_endpoints():
    """Test all the new MCP discovery endpoints"""
    
    # Test root discovery endpoint
    print("Testing /api/mcp/ discovery endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/mcp/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Discovery endpoint working!")
            print(f"   - Service: {data.get('service')}")
            print(f"   - Tools count: {data.get('capabilities', {}).get('tools')}")
            print(f"   - Endpoints: {len(data.get('endpoints', {}))}")
        else:
            print(f"[FAIL] Discovery endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Discovery endpoint error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test tools list endpoint
    print("Testing /api/mcp/tools/list endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/mcp/tools/list", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Tools list endpoint working!")
            print(f"   - Total tools: {data.get('total_tools')}")
            print(f"   - Categories: {', '.join(data.get('categories', []))}")
            print(f"   - Tools:")
            for tool in data.get('tools', [])[:3]:  # Show first 3 tools
                print(f"     - {tool.get('name')}: {tool.get('description')[:50]}...")
        else:
            print(f"[FAIL] Tools list endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Tools list endpoint error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test schema endpoint
    print("Testing /api/mcp/schema endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/mcp/schema", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Schema endpoint working!")
            print(f"   - Schema: {data.get('$schema', 'N/A')}")
            print(f"   - Title: {data.get('title')}")
            print(f"   - Server: {data.get('server_info', {}).get('name')}")
        else:
            print(f"[FAIL] Schema endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Schema endpoint error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test documentation endpoint
    print("Testing /api/mcp/docs endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/mcp/docs", timeout=5)
        if response.status_code == 200:
            print(f"[OK] Documentation endpoint working!")
            print(f"   - Content type: {response.headers.get('content-type')}")
            print(f"   - Content length: {len(response.content)} bytes")
            if 'Sunny AI Platform' in response.text:
                print(f"   - Documentation page verified!")
        else:
            print(f"[FAIL] Documentation endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Documentation endpoint error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test the JSON-RPC protocol endpoint with tools/list
    print("Testing JSON-RPC protocol at /api/mcp...")
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": "test-1",
            "method": "tools/list",
            "params": {}
        }
        response = requests.post(f"{BASE_URL}/api/mcp", json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if "result" in data and "tools" in data["result"]:
                print(f"[OK] JSON-RPC protocol working!")
                print(f"   - Tools returned: {len(data['result']['tools'])}")
            else:
                print(f"[FAIL] JSON-RPC protocol response invalid: {data}")
        else:
            print(f"[FAIL] JSON-RPC protocol failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] JSON-RPC protocol error: {e}")

if __name__ == "__main__":
    print("Testing MCP Discovery Endpoints\n")
    print("="*50)
    print("\n")
    
    test_discovery_endpoints()
    
    print("\nTesting complete!")
    print("\nURLs for Claude.ai MCP connector:")
    print("  - https://sunny-stack.com/api/mcp/")
    print("  - https://sunny-stack.com/api/mcp/tools/list")
    print("  - https://sunny-stack.com/api/mcp/tools/execute")