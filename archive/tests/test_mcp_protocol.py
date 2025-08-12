"""
Test script for MCP JSON-RPC Protocol
Tests proper MCP handshake and tool calls
"""

import requests
import json
from datetime import datetime

# Test against local backend
BASE_URL = "http://localhost:8000/api/mcp"

def test_mcp_info():
    """Test GET endpoint for server info"""
    print("\n=== Testing MCP Server Info (GET) ===")
    response = requests.get(BASE_URL)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_mcp_initialize():
    """Test MCP initialize handshake"""
    print("\n=== Testing MCP Initialize ===")
    
    request_data = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "clientInfo": {
                "name": "test-client",
                "version": "1.0.0"
            }
        }
    }
    
    response = requests.post(BASE_URL, json=request_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Check for proper MCP response
    data = response.json()
    assert data.get("jsonrpc") == "2.0"
    assert data.get("id") == 1
    assert "result" in data
    assert data["result"].get("protocolVersion") == "2024-11-05"
    
    return True

def test_mcp_tools_list():
    """Test MCP tools/list request"""
    print("\n=== Testing MCP Tools List ===")
    
    request_data = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    }
    
    response = requests.post(BASE_URL, json=request_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Check response format
    data = response.json()
    assert data.get("jsonrpc") == "2.0"
    assert data.get("id") == 2
    assert "result" in data
    assert "tools" in data["result"]
    assert len(data["result"]["tools"]) > 0
    
    print(f"\nAvailable tools: {len(data['result']['tools'])}")
    for tool in data["result"]["tools"]:
        print(f"  - {tool['name']}: {tool['description']}")
    
    return True

def test_mcp_tool_call():
    """Test MCP tool call - read claude.md"""
    print("\n=== Testing MCP Tool Call (read_file) ===")
    
    request_data = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {
                "path": "claude.md"
            }
        }
    }
    
    response = requests.post(BASE_URL, json=request_data)
    print(f"Status: {response.status_code}")
    
    # Check response
    data = response.json()
    assert data.get("jsonrpc") == "2.0"
    assert data.get("id") == 3
    
    if "result" in data:
        content = data["result"].get("content", "")
        print(f"File read successful. Content length: {len(content)} characters")
        # Handle Unicode in content preview
        try:
            preview = content[:200].encode('ascii', 'replace').decode('ascii')
            print(f"First 200 chars: {preview}...")
        except:
            print("Content preview: [Contains special characters]")
        return True
    else:
        print(f"Error: {data.get('error')}")
        return False

def test_mcp_ping():
    """Test MCP ping request"""
    print("\n=== Testing MCP Ping ===")
    
    request_data = {
        "jsonrpc": "2.0",
        "id": 4,
        "method": "ping",
        "params": {}
    }
    
    response = requests.post(BASE_URL, json=request_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    data = response.json()
    assert data.get("result", {}).get("pong") == True
    
    return True

def test_invalid_method():
    """Test invalid method handling"""
    print("\n=== Testing Invalid Method ===")
    
    request_data = {
        "jsonrpc": "2.0",
        "id": 5,
        "method": "invalid/method",
        "params": {}
    }
    
    response = requests.post(BASE_URL, json=request_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == -32601  # Method not found
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("MCP JSON-RPC Protocol Test Suite")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    
    tests = [
        ("Server Info", test_mcp_info),
        ("Initialize", test_mcp_initialize),
        ("Tools List", test_mcp_tools_list),
        ("Tool Call", test_mcp_tool_call),
        ("Ping", test_mcp_ping),
        ("Invalid Method", test_invalid_method)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                print(f"[PASS] {test_name}")
                passed += 1
            else:
                print(f"[FAIL] {test_name}")
                failed += 1
        except Exception as e:
            print(f"[FAIL] {test_name} - Exception: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("SUCCESS: All tests passed! MCP protocol is working correctly.")
    else:
        print("WARNING: Some tests failed. Please check the implementation.")