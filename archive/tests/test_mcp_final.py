"""Final test of MCP protocol endpoints"""
import requests
import json

# Test both simple and main endpoints
endpoints = [
    "https://sunny-stack.com/api/mcp",
    "https://sunny-stack.com/api/mcp/simple"
]

for base_url in endpoints:
    print(f"\nTesting: {base_url}")
    print("=" * 50)
    
    # Test 1: Initialize
    print("1. Initialize:")
    try:
        response = requests.post(base_url, json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if "result" in data:
                print(f"   [OK] Protocol: {data['result'].get('protocolVersion')}")
                print(f"   [OK] Server: {data['result'].get('serverInfo', {}).get('name')}")
            else:
                print(f"   [ERROR] Error: {data.get('error')}")
        else:
            print(f"   [ERROR] Error: {response.text[:100]}")
    except Exception as e:
        print(f"   [ERROR] Exception: {e}")
    
    # Test 2: Tools List
    print("\n2. Tools List:")
    try:
        response = requests.post(base_url, json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if "result" in data:
                tools = data['result'].get('tools', [])
                print(f"   [OK] Tools available: {len(tools)}")
                for tool in tools[:3]:
                    print(f"     - {tool.get('name')}: {tool.get('description')[:50]}...")
            else:
                print(f"   [ERROR] Error: {data.get('error')}")
        else:
            print(f"   [ERROR] Error: {response.text[:100]}")
    except Exception as e:
        print(f"   [ERROR] Exception: {e}")
    
    # Test 3: Ping
    print("\n3. Ping:")
    try:
        response = requests.post(base_url, json={
            "jsonrpc": "2.0",
            "id": 3,
            "method": "ping",
            "params": {}
        })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if "result" in data:
                print(f"   [OK] Pong: {data['result'].get('pong')}")
            else:
                print(f"   [ERROR] Error: {data.get('error')}")
        else:
            print(f"   [ERROR] Error: {response.text[:100]}")
    except Exception as e:
        print(f"   [ERROR] Exception: {e}")

print("\n" + "=" * 50)
print("MCP Protocol Testing Complete")
print("\nRECOMMENDED URL for Claude.ai MCP:")
print("https://sunny-stack.com/api/mcp")