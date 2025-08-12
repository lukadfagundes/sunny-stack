#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to verify MCP access to claude.md context file
"""

import requests
import json
import sys
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8000/api/mcp"
AUTH_URL = "http://localhost:8000/api/auth"

# Test credentials
EMAIL = "admin@sunny-stack.com"
PASSWORD = "admin123"

def test_claude_md_access():
    """Test reading and writing to claude.md"""
    
    session = requests.Session()
    
    # 1. Login
    print("🔐 Logging in...")
    response = session.post(
        f"{AUTH_URL}/login",
        json={"email": EMAIL, "password": PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        print("✅ Login successful")
    else:
        print(f"❌ Login failed: {response.status_code}")
        return
    
    # 2. Create session for write operations
    print("\n📝 Creating MCP session...")
    response = session.post(
        f"{BASE_URL}/session",
        json={"action": "create"}
    )
    if response.status_code == 200:
        data = response.json()
        session_id = data["session_id"]
        session.headers.update({"X-Session-Id": session_id})
        print(f"✅ Session created: {session_id}")
    
    # 3. Test reading claude.md
    print("\n📖 Testing READ access to claude.md...")
    response = session.get(f"{BASE_URL}/files/read?path=claude.md")
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            print("✅ Successfully read claude.md")
            print(f"   Size: {data.get('size')} bytes")
            print(f"   Lines: {data.get('lines')}")
            
            # Get the content
            content = data.get('content', '')
            
            # 4. Test writing to claude.md (update timestamp)
            print("\n✏️ Testing WRITE access to claude.md...")
            
            # Update the last updated timestamp
            updated_content = content.replace(
                "**Last Updated**: 2025-08-11 00:42:00 PST",
                f"**Last Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} PST"
            )
            
            # Add a test session entry
            session_marker = "**Last Session**: 2025-08-11 - MCP Full Implementation"
            updated_content = updated_content.replace(
                session_marker,
                f"{session_marker}\n**Test Session**: {datetime.now().strftime('%Y-%m-%d %H:%M')} - Context System Verification"
            )
            
            response = session.post(
                f"{BASE_URL}/files/write",
                json={
                    "path": "claude.md",
                    "content": updated_content,
                    "commit_message": "🔄 Update claude.md context - test session"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print("✅ Successfully wrote to claude.md")
                    print(f"   Backup created: {data.get('backup_created') is not None}")
                    print(f"   Git committed: {data.get('committed')}")
                else:
                    print("❌ Write operation failed")
            else:
                print(f"❌ Write request failed: {response.status_code}")
        else:
            print("❌ Read operation failed")
    else:
        print(f"❌ Read request failed: {response.status_code}")
    
    # 5. Test project tree includes claude.md
    print("\n🌳 Verifying claude.md in project tree...")
    response = session.get(f"{BASE_URL}/files/tree?max_depth=1")
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            tree = data.get("tree", {})
            children = tree.get("children", [])
            claude_md_found = any(
                child.get("name") == "claude.md" 
                for child in children 
                if child.get("type") == "file"
            )
            if claude_md_found:
                print("✅ claude.md found in project tree")
            else:
                print("❌ claude.md not found in project tree")
        else:
            print("❌ Tree retrieval failed")
    
    print("\n" + "="*50)
    print("✅ Claude Context System Test Complete!")
    print("="*50)

if __name__ == "__main__":
    test_claude_md_access()