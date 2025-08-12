"""Test MCP protocol against live server"""
import requests
import json

# Test against live server
BASE_URL = "https://sunny-stack.com/api/mcp"

print("Testing MCP Protocol on Live Server")
print("=" * 50)

# Test 1: Server Info
print("\n1. Testing GET /api/mcp/info")
try:
    response = requests.get(f"{BASE_URL}/info")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)[:200]}...")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Initialize
print("\n2. Testing POST /api/mcp (initialize)")
try:
    request_data = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {}
    }
    response = requests.post(BASE_URL, json=request_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)[:500]}...")
    else:
        print(f"Error Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Tools List
print("\n3. Testing POST /api/mcp (tools/list)")
try:
    request_data = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    }
    response = requests.post(BASE_URL, json=request_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Tools count: {len(data.get('result', {}).get('tools', []))}")
        print(f"First tool: {json.dumps(data.get('result', {}).get('tools', [{}])[0], indent=2)[:200]}...")
    else:
        print(f"Error Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 50)
print("MCP Protocol Test Complete")