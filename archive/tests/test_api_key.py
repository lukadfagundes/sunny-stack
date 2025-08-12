#!/usr/bin/env python
"""Test API key validation"""

import sys
import os
import hashlib

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.api_key_manager import api_key_manager

# Test key from the file
test_key = "QIWmnmR50_jDNa_iKzdbz6bsCYvIZKDEkz0JLRKFDP0"

print(f"Testing API key: {test_key[:8]}...")
print(f"Key hash: {hashlib.sha256(test_key.encode()).hexdigest()[:16]}...")

# Validate the key
result = api_key_manager.validate_key(test_key)

if result:
    print(f"[SUCCESS] Key is valid!")
    print(f"  Name: {result['name']}")
    print(f"  Permissions: {result['permissions']}")
    print(f"  Usage count: {result['usage_count']}")
else:
    print("[ERROR] Key validation failed!")
    
    # Check stored keys
    print("\nStored keys:")
    for key_info in api_key_manager.list_keys():
        print(f"  - {key_info['name']} (ID: {key_info['key_id']})")
        
    # Try to generate a new key
    print("\nGenerating new test key...")
    new_key = api_key_manager.generate_key(
        name="test_mcp_key",
        description="Test key for debugging",
        permissions=["mcp.*"]
    )
    print(f"New key generated: {new_key['key']}")
    print(f"Key ID: {new_key['key_id']}")
    
    # Test the new key
    test_result = api_key_manager.validate_key(new_key['key'])
    if test_result:
        print("[SUCCESS] New key validates correctly!")
    else:
        print("[ERROR] New key also fails validation!")