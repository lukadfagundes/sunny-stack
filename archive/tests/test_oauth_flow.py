"""
Test script for Google OAuth flow with MCP integration
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_oauth_endpoints():
    """Test all OAuth endpoints"""
    print("Testing Google OAuth Integration for MCP")
    print("=" * 50)
    
    # Test 1: OAuth test endpoint
    print("\nTest 1: OAuth Test Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/api/oauth/google/test")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   [OK] OAuth Status: {data.get('status')}")
            print(f"   Google Client Configured: {data.get('google_client_configured')}")
            print(f"   Endpoints Available:")
            for name, path in data.get('endpoints', {}).items():
                print(f"      - {name}: {path}")
        else:
            print(f"   [ERROR] Error: {response.text}")
    except Exception as e:
        print(f"   [ERROR] Failed: {str(e)}")
    
    # Test 2: Authorization endpoint (without actual redirect)
    print("\nTest 2: Authorization Endpoint")
    try:
        params = {
            "client_id": "test-client",
            "redirect_uri": "https://claude.ai/callback",
            "scope": "openid email profile",
            "state": "test-state-123",
            "response_type": "code"
        }
        response = requests.get(
            f"{BASE_URL}/api/oauth/google/authorize",
            params=params,
            allow_redirects=False
        )
        print(f"   Status: {response.status_code}")
        if response.status_code in [302, 307]:  # Redirect response
            print(f"   [OK] Redirect Location: {response.headers.get('location', 'N/A')[:100]}...")
            print("   [OK] OAuth flow would redirect to Google")
        else:
            print(f"   [ERROR] Unexpected response: {response.text[:200]}")
    except Exception as e:
        print(f"   [ERROR] Failed: {str(e)}")
    
    # Test 3: Token endpoint (with mock data)
    print("\nTest 3: Token Exchange Endpoint")
    try:
        data = {
            "grant_type": "authorization_code",
            "code": "test-auth-code",
            "client_id": "test-client",
            "client_secret": "test-secret"
        }
        response = requests.post(
            f"{BASE_URL}/api/oauth/google/token",
            data=data
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 400:
            print("   [OK] Token validation working (invalid code rejected)")
        elif response.status_code == 200:
            print("   [OK] Token endpoint accessible")
            print(f"   Response: {response.json()}")
        else:
            print(f"   [WARNING] Response: {response.text[:200]}")
    except Exception as e:
        print(f"   [ERROR] Failed: {str(e)}")
    
    # Test 4: MCP Status with Bearer token
    print("\nTest 4: MCP Status with OAuth Token")
    try:
        # First, get MCP status without auth
        response = requests.get(f"{BASE_URL}/api/mcp/status")
        print(f"   Without Auth - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Authenticated User: {data.get('authenticated_user', 'None')}")
        
        # Now try with a Bearer token
        headers = {
            "Authorization": "Bearer test-token-123"
        }
        response = requests.get(f"{BASE_URL}/api/mcp/status", headers=headers)
        print(f"   With Auth - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Authenticated User: {data.get('authenticated_user', 'None')}")
            print("   [OK] OAuth integration with MCP working")
    except Exception as e:
        print(f"   [ERROR] Failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("OAuth Integration Test Complete!")
    print("\nNext Steps:")
    print("1. Configure Google OAuth credentials in .env")
    print("2. Add your domain to Google OAuth authorized redirects")
    print("3. Connect Claude.ai MCP with OAuth URL:")
    print("   https://sunny-stack.com/api/oauth/google/authorize")

if __name__ == "__main__":
    test_oauth_endpoints()