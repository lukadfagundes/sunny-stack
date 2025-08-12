#!/usr/bin/env python3
"""
Test script to verify auth endpoint returns valid JSON
"""

import json
import requests
import sys

def test_auth_json():
    """Test that auth endpoint returns valid JSON"""
    print("🔧 [JSON_TEST] Testing auth endpoint JSON response...")
    
    # Test credentials
    test_email = "luka@sunny-stack.com"
    test_password = "S@m3fweak"
    
    # Backend URL
    backend_url = "http://localhost:8000"
    
    # Prepare login request
    login_data = {
        "email": test_email,
        "password": test_password
    }
    
    try:
        # Make the request
        print(f"📊 [JSON_TEST] Sending login request to {backend_url}/api/auth/login")
        response = requests.post(
            f"{backend_url}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Get raw response text
        response_text = response.text
        print(f"🎯 [JSON_TEST] Response status: {response.status_code}")
        print(f"📋 [JSON_TEST] Response length: {len(response_text)} chars")
        print(f"🔍 [JSON_TEST] First 200 chars: {response_text[:200]}")
        
        if len(response_text) > 200:
            print(f"📋 [JSON_TEST] Last 100 chars: {response_text[-100:]}")
        
        # Try to parse JSON
        try:
            data = json.loads(response_text)
            print("✅ [JSON_TEST] Valid JSON response!")
            print(f"📊 [JSON_TEST] Response structure:")
            print(f"  - Has access_token: {'access_token' in data}")
            print(f"  - Has user: {'user' in data}")
            if 'user' in data:
                print(f"  - User email: {data['user'].get('email')}")
                print(f"  - User role: {data['user'].get('role')}")
                print(f"  - Is master: {data['user'].get('is_master')}")
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ [JSON_TEST] JSON parse error: {e}")
            print(f"🔍 [JSON_TEST] Error position: {e.pos}")
            print(f"📊 [JSON_TEST] Error details: {e.msg}")
            
            # Try to identify the problem
            if response_text.startswith("{") and not response_text.endswith("}"):
                print("⚠️ [JSON_TEST] Response appears truncated (missing closing brace)")
            elif not response_text.startswith("{"):
                print("⚠️ [JSON_TEST] Response doesn't start with JSON (might have prefix)")
            elif response_text.count("{") != response_text.count("}"):
                print("⚠️ [JSON_TEST] Mismatched braces in response")
            
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ [JSON_TEST] Could not connect to backend at", backend_url)
        print("⚠️  Make sure the backend is running on port 8000")
        return False
    except Exception as e:
        print(f"❌ [JSON_TEST] Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_auth_json()
    sys.exit(0 if success else 1)