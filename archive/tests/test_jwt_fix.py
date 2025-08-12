#!/usr/bin/env python3
"""Test JWT signature verification fix"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_login_and_verify():
    """Test login and token verification"""
    print("\n=== Testing JWT Signature Fix ===\n")
    
    # Step 1: Test login
    print("1. Testing login...")
    login_data = {
        "email": "luka@sunny-stack.com",
        "password": "S@m3fweak"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"   Login Response: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   Error: {response.text}")
            return False
            
        data = response.json()
        token = data.get("access_token")
        
        if not token:
            print("   Error: No access token in response")
            return False
            
        print(f"   Success! Got token: {token[:20]}...")
        
        # Step 2: Test token verification
        print("\n2. Testing token verification...")
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        # Try the verify-token endpoint
        response = requests.post(f"{BASE_URL}/api/auth/verify-token", headers=headers)
        print(f"   Verify Response: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   Success! Token is valid")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"   Error: {response.text}")
            
            # Also try the verify endpoint
            print("\n3. Trying alternate verify endpoint...")
            response = requests.get(f"{BASE_URL}/api/auth/verify", headers=headers)
            print(f"   Verify Response: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   Success! Token is valid via alternate endpoint")
                print(f"   Response: {response.json()}")
                return True
            else:
                print(f"   Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"   Error: {e}")
        return False

if __name__ == "__main__":
    # Wait a moment for server to fully start
    time.sleep(2)
    
    success = test_login_and_verify()
    
    if success:
        print("\n✅ JWT SIGNATURE FIX SUCCESSFUL!")
        print("The token signature verification is now working correctly.")
    else:
        print("\n❌ JWT SIGNATURE ISSUE PERSISTS")
        print("The token signature verification is still failing.")
        print("\nDebug Steps:")
        print("1. Check that JWT_SECRET_KEY is set in backend/.env")
        print("2. Ensure both auth.py and auth_system.py load dotenv")
        print("3. Verify both files use the same SECRET_KEY")