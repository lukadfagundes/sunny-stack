#!/usr/bin/env python3
"""Direct JWT test without going through middleware"""

import jwt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

# Test data
test_token = None
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

print("=== Direct JWT Test ===\n")
print(f"SECRET_KEY from .env: {SECRET_KEY[:20]}...")

# Step 1: Create a token (simulating what auth.py does)
print("\n1. Creating JWT token...")
token_data = {"sub": "luka@sunny-stack.com", "email": "luka@sunny-stack.com"}
test_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
print(f"   Token created: {test_token[:50]}...")

# Step 2: Decode the token (simulating what auth_system.py does)
print("\n2. Decoding JWT token...")
try:
    decoded = jwt.decode(test_token, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"   Token decoded successfully!")
    print(f"   Payload: {decoded}")
    
    # Step 3: Check if it has the required fields
    if decoded.get("sub"):
        print(f"\n✅ SUCCESS! Token signature verification works!")
        print(f"   The JWT secret key is consistent.")
    else:
        print(f"\n❌ ERROR: Token missing 'sub' claim")
        
except jwt.InvalidSignatureError as e:
    print(f"\n❌ SIGNATURE ERROR: {e}")
    print("   The JWT secret keys don't match!")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")