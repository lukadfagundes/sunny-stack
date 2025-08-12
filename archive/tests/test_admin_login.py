"""
Test Admin Login with New Credentials
Verifies that the admin credentials update was successful
"""

import requests
import json
import sys
from datetime import datetime

# API Configuration
BASE_URL = "http://localhost:8000"

# New Admin Credentials
ADMIN_EMAIL = "luka@sunny-stack.com"
ADMIN_PASSWORD = "S@m3fweak"

def test_login():
    """Test login with new admin credentials"""
    print("=" * 60)
    print("TESTING ADMIN LOGIN")
    print("=" * 60)
    print(f"Time: {datetime.now().isoformat()}")
    print(f"API URL: {BASE_URL}")
    print(f"Email: {ADMIN_EMAIL}")
    print(f"Password: {'*' * len(ADMIN_PASSWORD)}")
    print()
    
    # Test 1: Login with new credentials
    print("1. Testing login endpoint...")
    login_url = f"{BASE_URL}/api/auth/login"
    
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(login_url, json=login_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("   [OK] Login successful!")
            data = response.json()
            
            # Extract token
            token = data.get("access_token") or data.get("token")
            if token:
                print(f"   [OK] JWT Token received: {token[:20]}...")
                
                # Test 2: Verify token
                print("\n2. Testing token verification...")
                verify_url = f"{BASE_URL}/api/auth/verify"
                headers = {
                    "Authorization": f"Bearer {token}"
                }
                
                verify_response = requests.get(verify_url, headers=headers, timeout=10)
                print(f"   Status Code: {verify_response.status_code}")
                
                if verify_response.status_code == 200:
                    print("   [OK] Token verification successful!")
                    user_data = verify_response.json()
                    print(f"   User Role: {user_data.get('role', 'N/A')}")
                    print(f"   User Email: {user_data.get('email', 'N/A')}")
                else:
                    print(f"   [ERROR] Token verification failed: {verify_response.text}")
                
                # Test 3: Access protected endpoint
                print("\n3. Testing protected endpoint access...")
                protected_url = f"{BASE_URL}/api/mcp/debug/status"
                
                protected_response = requests.get(protected_url, headers=headers, timeout=10)
                print(f"   Status Code: {protected_response.status_code}")
                
                if protected_response.status_code == 200:
                    print("   [OK] Protected endpoint accessible!")
                else:
                    print(f"   [ERROR] Protected endpoint failed: {protected_response.text}")
                
                return True
            else:
                print("   [ERROR] No token in response")
                print(f"   Response: {json.dumps(data, indent=2)}")
                return False
        else:
            print(f"   [ERROR] Login failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   [ERROR] Cannot connect to backend server")
        print("   Make sure the backend is running on port 8000")
        return False
    except Exception as e:
        print(f"   [ERROR] Unexpected error: {e}")
        return False

def test_password_reset():
    """Test password reset functionality"""
    print("\n4. Testing password reset flow...")
    
    try:
        # Request password reset
        reset_url = f"{BASE_URL}/api/auth/request-reset"
        reset_data = {"email": ADMIN_EMAIL}
        
        response = requests.post(reset_url, json=reset_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("   [OK] Password reset email would be sent")
            return True
        else:
            print(f"   [WARNING] Password reset returned: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   [ERROR] Password reset test failed: {e}")
        return False

def main():
    """Run all tests"""
    
    # Test login
    login_success = test_login()
    
    # Test password reset
    reset_success = test_password_reset()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Login Test: {'[PASSED]' if login_success else '[FAILED]'}")
    print(f"Password Reset Test: {'[PASSED]' if reset_success else '[FAILED]'}")
    
    if login_success:
        print("\n[SUCCESS] Admin credentials updated successfully!")
        print(f"You can now login at https://sunny-stack.com with:")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
    else:
        print("\n[FAILURE] Some tests failed. Please check the backend logs.")
        
    print("=" * 60)
    
    return 0 if login_success else 1

if __name__ == "__main__":
    sys.exit(main())