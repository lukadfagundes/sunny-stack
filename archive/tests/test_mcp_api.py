#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for MCP API functionality
Tests all read/write operations, security features, and debugging endpoints
"""

import requests
import json
import time
import sys
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
BASE_URL = "http://localhost:8000/api/mcp"
AUTH_URL = "http://localhost:8000/api/auth"

# Test credentials
EMAIL = "admin@sunny-stack.com"
PASSWORD = "admin123"  # Change this to your actual admin password

class MCPAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.session_id = None
        
    def login(self):
        """Authenticate and get JWT token"""
        print("🔐 Logging in...")
        response = self.session.post(
            f"{AUTH_URL}/login",
            json={"email": EMAIL, "password": PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def create_session(self):
        """Create MCP write session"""
        print("\n📝 Creating MCP session...")
        response = self.session.post(
            f"{BASE_URL}/session",
            json={"action": "create"}
        )
        if response.status_code == 200:
            data = response.json()
            self.session_id = data["session_id"]
            self.session.headers.update({"X-Session-Id": self.session_id})
            print(f"✅ Session created: {self.session_id}")
            return True
        else:
            print(f"❌ Session creation failed: {response.status_code}")
            return False
    
    def test_status(self):
        """Test MCP status endpoint"""
        print("\n📊 Testing MCP Status...")
        response = self.session.get(f"{BASE_URL}/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ MCP Status: {data['status']}")
            print(f"   Capabilities: {', '.join(data.get('capabilities', []))}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
    
    def test_debug_status(self):
        """Test debug status endpoint"""
        print("\n🔍 Testing Debug Status...")
        response = self.session.get(f"{BASE_URL}/debug/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Debug Status:")
            print(f"   Service: {data.get('mcp_service', 'unknown')}")
            print(f"   File Permissions: {data.get('file_permissions', {})}")
            print(f"   Active Sessions: {data.get('active_sessions', 0)}")
        else:
            print(f"❌ Debug status failed: {response.status_code}")
    
    def test_permissions(self):
        """Test file permissions"""
        print("\n🔒 Testing File Permissions...")
        response = self.session.get(f"{BASE_URL}/debug/permissions")
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", {})
            print(f"✅ Permission Tests:")
            for test, result in results.items():
                status = "✅" if result else "❌"
                print(f"   {status} {test}: {result}")
        else:
            print(f"❌ Permission test failed: {response.status_code}")
    
    def test_project_tree(self):
        """Test project tree endpoint"""
        print("\n🌳 Testing Project Tree...")
        response = self.session.get(f"{BASE_URL}/files/tree?max_depth=2")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                tree = data.get("tree", {})
                print(f"✅ Project tree retrieved")
                print(f"   Root: {tree.get('name', 'unknown')}")
                print(f"   Children: {len(tree.get('children', []))} items")
            else:
                print("❌ Project tree failed")
        else:
            print(f"❌ Project tree request failed: {response.status_code}")
    
    def test_file_read(self):
        """Test file read operation"""
        print("\n📖 Testing File Read...")
        response = self.session.get(f"{BASE_URL}/files/read?path=package.json")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"✅ File read successful")
                print(f"   Path: {data.get('path')}")
                print(f"   Size: {data.get('size')} bytes")
                print(f"   Lines: {data.get('lines')}")
            else:
                print("❌ File read failed")
        else:
            print(f"❌ File read request failed: {response.status_code}")
    
    def test_file_search(self):
        """Test file search operation"""
        print("\n🔎 Testing File Search...")
        response = self.session.get(
            f"{BASE_URL}/files/search?query=import&file_pattern=*.py&max_results=5"
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"✅ Search successful")
                print(f"   Query: {data.get('query')}")
                print(f"   Files searched: {data.get('files_searched')}")
                print(f"   Results found: {data.get('results_found')}")
            else:
                print("❌ Search failed")
        else:
            print(f"❌ Search request failed: {response.status_code}")
    
    def test_write_operations(self):
        """Test write operations"""
        print("\n✍️ Testing Write Operations...")
        
        test_file = "mcp_test_file.md"
        test_content = f"# MCP Test File\\n\\nCreated at: {datetime.now().isoformat()}\\n\\nThis is a test of MCP write functionality."
        
        # Test file creation
        print("  📝 Creating test file...")
        response = self.session.post(
            f"{BASE_URL}/files/create",
            json={
                "path": test_file,
                "content": test_content,
                "commit_message": "Test: Create file via MCP API"
            }
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"  ✅ File created: {test_file}")
                print(f"     Committed: {data.get('committed')}")
            else:
                print("  ❌ File creation failed")
        else:
            print(f"  ❌ File creation request failed: {response.status_code}")
            return
        
        # Test file update
        print("  ✏️ Updating test file...")
        updated_content = test_content + "\\n\\n## Updated Section\\n\\nThis section was added via update."
        response = self.session.post(
            f"{BASE_URL}/files/write",
            json={
                "path": test_file,
                "content": updated_content,
                "commit_message": "Test: Update file via MCP API"
            }
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"  ✅ File updated")
                print(f"     Backup created: {data.get('backup_created') is not None}")
            else:
                print("  ❌ File update failed")
        else:
            print(f"  ❌ File update request failed: {response.status_code}")
        
        # Test file deletion
        print("  🗑️ Deleting test file...")
        response = self.session.delete(
            f"{BASE_URL}/files/delete",
            json={
                "path": test_file,
                "commit_message": "Test: Delete file via MCP API"
            }
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"  ✅ File deleted")
                print(f"     Backup created: {data.get('backup_created') is not None}")
            else:
                print("  ❌ File deletion failed")
        else:
            print(f"  ❌ File deletion request failed: {response.status_code}")
    
    def test_security(self):
        """Test security features"""
        print("\n🛡️ Testing Security Features...")
        
        # Test path traversal protection
        print("  🚫 Testing path traversal protection...")
        response = self.session.get(f"{BASE_URL}/files/read?path=../../../etc/passwd")
        if response.status_code == 403:
            print("  ✅ Path traversal blocked (403 Forbidden)")
        else:
            print(f"  ❌ Path traversal not blocked! Status: {response.status_code}")
        
        # Test protected path access
        print("  🚫 Testing protected path access...")
        response = self.session.get(f"{BASE_URL}/files/read?path=node_modules/test.js")
        if response.status_code == 403:
            print("  ✅ Protected path access blocked (403 Forbidden)")
        else:
            print(f"  ❌ Protected path not blocked! Status: {response.status_code}")
        
        # Test invalid file extension
        print("  🚫 Testing invalid file extension...")
        response = self.session.post(
            f"{BASE_URL}/files/create",
            json={
                "path": "test.exe",
                "content": "malicious",
                "commit_message": "Test"
            }
        )
        if response.status_code == 403:
            print("  ✅ Invalid extension blocked (403 Forbidden)")
        else:
            print(f"  ❌ Invalid extension not blocked! Status: {response.status_code}")
    
    def test_git_status(self):
        """Test git status endpoint"""
        print("\n🐙 Testing Git Status...")
        response = self.session.get(f"{BASE_URL}/git/status")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                status = data.get("status", {})
                print(f"✅ Git status retrieved")
                print(f"   Branch: {status.get('branch', 'unknown')}")
                print(f"   Modified files: {len(status.get('modified', []))}")
                print(f"   Untracked files: {len(status.get('untracked', []))}")
            else:
                print(f"❌ Git status failed: {data.get('error')}")
        else:
            print(f"❌ Git status request failed: {response.status_code}")
    
    def test_comprehensive_suite(self):
        """Run comprehensive test suite"""
        print("\n🧪 Running Comprehensive Test Suite...")
        response = self.session.post(f"{BASE_URL}/debug/run-tests")
        if response.status_code == 200:
            data = response.json()
            summary = data.get("test_summary", {})
            stats = data.get("stats", {})
            
            print(f"\n📊 Test Results:")
            print(f"   Total: {stats.get('total', 0)}")
            print(f"   Passed: {stats.get('passed', 0)}")
            print(f"   Failed: {stats.get('failed', 0)}")
            print(f"   Status: {data.get('overall_status', 'unknown')}")
            
            print(f"\n📋 Individual Tests:")
            for test_name, result in summary.items():
                if "PASSED" in str(result):
                    print(f"   ✅ {test_name}: {result}")
                elif "FAILED" in str(result):
                    print(f"   ❌ {test_name}: {result}")
                else:
                    print(f"   ⚠️ {test_name}: {result}")
        else:
            print(f"❌ Test suite failed: {response.status_code}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("🚀 MCP API Test Suite")
        print("=" * 60)
        
        # Login first
        if not self.login():
            print("\n❌ Cannot proceed without authentication")
            return
        
        # Create session for write operations
        if not self.create_session():
            print("\n⚠️ Write operations may fail without session")
        
        # Run all tests
        self.test_status()
        self.test_debug_status()
        self.test_permissions()
        self.test_project_tree()
        self.test_file_read()
        self.test_file_search()
        self.test_security()
        self.test_write_operations()
        self.test_git_status()
        self.test_comprehensive_suite()
        
        print("\n" + "=" * 60)
        print("✅ MCP API Test Suite Complete!")
        print("=" * 60)


if __name__ == "__main__":
    tester = MCPAPITester()
    tester.run_all_tests()