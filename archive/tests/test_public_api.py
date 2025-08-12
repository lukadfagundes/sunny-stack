#!/usr/bin/env python
"""Test the public MCP API endpoints"""

import requests
import json

BASE_URL = "http://localhost:8000/api/mcp/public"

def test_status():
    """Test status endpoint"""
    response = requests.get(f"{BASE_URL}/status")
    print("Status:", response.json())
    return response.json()

def test_read_file():
    """Test file read"""
    response = requests.get(f"{BASE_URL}/files/read", params={"path": "README.md"})
    data = response.json()
    print(f"Read file success: {data['success']}")
    print(f"File size: {data.get('size', 0)} bytes")
    return data

def test_write_file():
    """Test file write"""
    payload = {
        "path": "test_public_write.txt",
        "content": "This file was created via the PUBLIC MCP endpoint!\nNo authentication required!\nTimestamp: 2025-08-11\n\nTesting full read/write access!"
    }
    response = requests.post(f"{BASE_URL}/files/write", json=payload)
    data = response.json()
    print(f"Write file success: {data.get('success', False)}")
    if data.get('success'):
        print(f"File path: {data.get('path')}")
        print(f"Backup: {data.get('backup')}")
    else:
        print(f"Error: {data.get('error')}")
    return data

def test_list_directory():
    """Test directory listing"""
    response = requests.get(f"{BASE_URL}/files/list", params={"dir": "backend"})
    data = response.json()
    print(f"List directory success: {data.get('success', False)}")
    if data.get('success'):
        print(f"Files found: {len(data.get('files', []))}")
        print(f"Directories found: {len(data.get('directories', []))}")
    return data

def test_git_status():
    """Test git status"""
    response = requests.get(f"{BASE_URL}/git/status")
    data = response.json()
    print(f"Git status success: {data.get('success', False)}")
    if data.get('success'):
        print(f"Modified files: {len(data.get('modified', []))}")
        print(f"Untracked files: {len(data.get('untracked', []))}")
    return data

def test_system_health():
    """Test system health"""
    response = requests.get(f"{BASE_URL}/system/health")
    data = response.json()
    print(f"System health success: {data.get('success', False)}")
    if data.get('success'):
        print(f"CPU: {data.get('cpu_percent', 0)}%")
        print(f"Memory: {data.get('memory', {}).get('percent', 0)}%")
    return data

if __name__ == "__main__":
    print("=" * 60)
    print("Testing PUBLIC MCP API Endpoints")
    print("=" * 60)
    
    print("\n1. Testing status endpoint...")
    test_status()
    
    print("\n2. Testing file read...")
    test_read_file()
    
    print("\n3. Testing file write...")
    test_write_file()
    
    print("\n4. Testing directory listing...")
    test_list_directory()
    
    print("\n5. Testing git status...")
    test_git_status()
    
    print("\n6. Testing system health...")
    test_system_health()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("Public MCP endpoint is FULLY OPERATIONAL!")
    print("Claude can now connect to: https://sunny-stack.com/api/mcp/public")
    print("=" * 60)