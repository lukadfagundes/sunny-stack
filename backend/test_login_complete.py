#!/usr/bin/env python
"""
Complete auth test - verify login is working
"""
import requests
import json
from datetime import datetime

print(f"\n[AUTH_TEST] Starting complete authentication test")
print("=" * 60)

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
TEST_EMAIL = "luka@sunny-stack.com"
TEST_PASSWORD = "S@m3fweak"

print(f"[TEST] Testing login for: {TEST_EMAIL}")
print(f"[TEST] Backend URL: {BACKEND_URL}")
print(f"[TEST] Frontend URL: {FRONTEND_URL}")

# Test 1: Direct backend login
print("\n[1] Testing direct backend login...")
try:
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"[BACKEND] Response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"[BACKEND] Login successful!")
        print(f"[BACKEND] Response structure:")
        print(f"  - Has access_token: {bool(data.get('access_token'))}")
        print(f"  - Has refresh_token: {bool(data.get('refresh_token'))}")
        print(f"  - Has user object: {bool(data.get('user'))}")
        print(f"  - Requires MFA: {data.get('requires_mfa', False)}")
        
        if data.get('user'):
            user = data['user']
            print(f"\n[USER DATA]:")
            print(f"  - Email: {user.get('email')}")
            print(f"  - Name: {user.get('name')}")
            print(f"  - Role: {user.get('role')}")
            print(f"  - Is Master: {user.get('is_master')}")
            print(f"  - App Access: {user.get('app_access')}")
            
            if user.get('is_master') == True:
                print(f"\n[SUCCESS] Master admin access confirmed!")
            else:
                print(f"\n[WARNING] User is not master admin")
        else:
            print(f"\n[ERROR] No user object in response!")
            print(f"Full response: {json.dumps(data, indent=2)}")
    else:
        print(f"[ERROR] Backend login failed!")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"[ERROR] Backend test failed: {e}")

# Test 2: Frontend API route
print("\n[2] Testing frontend API route...")
try:
    response = requests.post(
        f"{FRONTEND_URL}/api/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"[FRONTEND] Response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"[FRONTEND] Login successful!")
        
        if data.get('user'):
            user = data['user']
            print(f"[FRONTEND] User data received:")
            print(f"  - Email: {user.get('email')}")
            print(f"  - Role: {user.get('role')}")
            print(f"  - Is Master: {user.get('is_master')}")
        else:
            print(f"[ERROR] No user object in frontend response!")
    else:
        print(f"[ERROR] Frontend login failed!")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"[WARNING] Frontend test failed (might not be running): {e}")

# Test 3: Verify database
print("\n[3] Verifying database directly...")
from pathlib import Path

db_path = Path("C:/Sunny/data/users.json")
if db_path.exists():
    with open(db_path, 'r') as f:
        users = json.load(f)
        if TEST_EMAIL in users:
            user = users[TEST_EMAIL]
            print(f"[DATABASE] User found:")
            print(f"  - Role: {user.get('role')}")
            print(f"  - Active: {user.get('is_active')}")
            print(f"  - MFA Enabled: {user.get('mfa_enabled')}")
        else:
            print(f"[ERROR] User not in database!")
else:
    print(f"[ERROR] Database file not found!")

print("\n" + "=" * 60)
print("[COMPLETE] Authentication test finished!")
print("\nNEXT STEPS:")
print("1. If backend login works but returns no user -> Check auth_system.authenticate_user")
print("2. If user object missing -> Check LoginResponse serialization")
print("3. If frontend fails -> Check API route forwarding")
print("4. Restart services after any changes")