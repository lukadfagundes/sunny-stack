#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create or update admin user for testing MCP API
"""

import bcrypt
import os
import sys
from pathlib import Path
from dotenv import load_dotenv, set_key

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load .env file
env_path = Path("backend/.env")
load_dotenv(env_path)

# Admin credentials
ADMIN_EMAIL = "luka@sunny-stack.com"
ADMIN_PASSWORD = "S@m3fweak"

# Hash the password
salt = bcrypt.gensalt()
hashed_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), salt).decode('utf-8')

# Update .env file
set_key(env_path, "ADMIN_EMAIL", ADMIN_EMAIL)
set_key(env_path, "ADMIN_PASSWORD_HASH", hashed_password)

print(f"✅ Admin user configured:")
print(f"   Email: {ADMIN_EMAIL}")
print(f"   Password: {ADMIN_PASSWORD}")
print(f"   Hash: {hashed_password[:20]}...")
print(f"\n✅ Updated backend/.env file")
print("\nYou can now use these credentials to test the MCP API.")