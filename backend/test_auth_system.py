#!/usr/bin/env python3
"""
Test Authentication System
Quick test to verify the auth system is working properly
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.auth.auth_system import SecureAuthSystem

async def test_auth():
    """Test authentication system"""
    print("[INFO] [TEST] Starting authentication system test...")
    print("=" * 60)
    
    # Initialize auth system
    auth_system = SecureAuthSystem()
    print(f"[SUCCESS] [TEST] Auth system initialized")
    print(f"[DATA] [TEST] Users loaded: {list(auth_system.users.keys())}")
    print("=" * 60)
    
    # Test 1: Correct credentials
    print("\n[TEST] TEST 1: Correct credentials")
    print("-" * 40)
    email = "luka@sunny-stack.com"
    password = "S@m3fweak"  # The password from CLAUDE.md
    
    result = await auth_system.authenticate_user(email, password)
    if result:
        print(f"[SUCCESS] [TEST] Authentication successful!")
        print(f"[DATA] [TEST] User data: {result.get('email')}, Role: {result.get('role')}")
    else:
        print(f"[FAIL] [TEST] Authentication failed!")
    
    print("=" * 60)
    
    # Test 2: Wrong password
    print("\n[TEST] TEST 2: Wrong password")
    print("-" * 40)
    wrong_password = "WrongPassword123"
    
    result = await auth_system.authenticate_user(email, wrong_password)
    if not result:
        print(f"[SUCCESS] [TEST] Correctly rejected wrong password")
    else:
        print(f"[FAIL] [TEST] Should have rejected wrong password!")
    
    print("=" * 60)
    
    # Test 3: Non-existent user
    print("\n[TEST] TEST 3: Non-existent user")
    print("-" * 40)
    fake_email = "fake@example.com"
    
    result = await auth_system.authenticate_user(fake_email, password)
    if not result:
        print(f"[SUCCESS] [TEST] Correctly rejected non-existent user")
    else:
        print(f"[FAIL] [TEST] Should have rejected non-existent user!")
    
    print("=" * 60)
    
    # Test 4: Token creation
    print("\n[TEST] TEST 4: Token creation")
    print("-" * 40)
    
    try:
        access_token = auth_system.create_access_token(data={"sub": email})
        refresh_token = auth_system.create_refresh_token(data={"sub": email})
        
        if access_token and refresh_token:
            print(f"[SUCCESS] [TEST] Tokens created successfully")
            print(f"[DATA] [TEST] Access token length: {len(access_token)}")
            print(f"[DATA] [TEST] Refresh token length: {len(refresh_token)}")
        else:
            print(f"[FAIL] [TEST] Token creation failed!")
    except Exception as e:
        print(f"[FAIL] [TEST] Token creation error: {e}")
    
    print("=" * 60)
    
    # Test 5: User permissions
    print("\n[TEST] TEST 5: User permissions")
    print("-" * 40)
    
    try:
        permissions = await auth_system.get_user_permissions(email)
        print(f"[SUCCESS] [TEST] Permissions retrieved")
        print(f"[DATA] [TEST] Apps: {permissions.get('apps')}")
        print(f"[DATA] [TEST] Is Master: {permissions.get('is_master')}")
    except Exception as e:
        print(f"[FAIL] [TEST] Permission retrieval error: {e}")
    
    print("=" * 60)
    print("\n[SUCCESS] [TEST] All tests completed!")

if __name__ == "__main__":
    asyncio.run(test_auth())