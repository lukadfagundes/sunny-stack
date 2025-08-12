#!/usr/bin/env python
"""
Emergency auth fix - test and fix password hash
"""
from passlib.context import CryptContext
import json
import sys
import io

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test the password
password = "S@m3fweak"
stored_hash = "$2b$12$TaZrS/.42CTAyMep9LWUMeDE1oiQPyLUrNi0Q3.za5EWpz16LwGEi"

print(f"[AUTH_EMERGENCY] Testing password verification")
print(f"[AUTH_EMERGENCY] Password to test: {password}")
print(f"[AUTH_EMERGENCY] Stored hash: {stored_hash[:20]}...")

# Verify password
result = pwd_context.verify(password, stored_hash)
print(f"[AUTH_EMERGENCY] Password verification result: {result}")

if not result:
    # Generate correct hash
    print(f"[AUTH_EMERGENCY] Password mismatch! Generating correct hash...")
    correct_hash = pwd_context.hash(password)
    print(f"[AUTH_EMERGENCY] Correct hash for '{password}':")
    print(f"[AUTH_EMERGENCY] {correct_hash}")
    
    # Update the users.json file
    print(f"\n[AUTH_EMERGENCY] Updating users.json with correct password hash...")
    
    with open("C:/Sunny/data/users.json", "r") as f:
        users = json.load(f)
    
    print(f"[AUTH_EMERGENCY] Current users: {list(users.keys())}")
    
    if "luka@sunny-stack.com" in users:
        users["luka@sunny-stack.com"]["password_hash"] = correct_hash
        
        with open("C:/Sunny/data/users.json", "w") as f:
            json.dump(users, f, indent=2)
        
        print(f"[AUTH_EMERGENCY] Password hash updated successfully!")
        print(f"[AUTH_EMERGENCY] You can now login with:")
        print(f"   Email: luka@sunny-stack.com")
        print(f"   Password: S@m3fweak")
    else:
        print(f"[AUTH_EMERGENCY] User not found in database!")
else:
    print(f"[AUTH_EMERGENCY] Password verification successful - hash is correct!")