#!/usr/bin/env python
"""
Quick script to change the master admin password
Run this immediately after deployment!
"""

import json
import getpass
from pathlib import Path
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def change_master_password():
    """Change the master admin password"""
    
    users_file = Path("backend/data/users.json")
    
    if not users_file.exists():
        print("ERROR: Users database not found!")
        print("Please run the platform first to initialize the database.")
        return False
    
    # Load users
    with open(users_file, 'r') as f:
        users = json.load(f)
    
    # Check for master admin
    master_email = "luka@sunny-stack.com"
    if master_email not in users:
        print(f"ERROR: Master admin account ({master_email}) not found!")
        return False
    
    print("=" * 60)
    print("        SUNNY PLATFORM - CHANGE MASTER PASSWORD")
    print("=" * 60)
    print()
    print(f"Changing password for: {master_email}")
    print()
    
    # Get new password
    while True:
        password = getpass.getpass("Enter NEW password (min 12 chars): ")
        if len(password) < 12:
            print("Password must be at least 12 characters long!")
            continue
            
        confirm = getpass.getpass("Confirm NEW password: ")
        if password != confirm:
            print("Passwords do not match! Try again.")
            continue
            
        break
    
    # Hash and update password
    hashed = pwd_context.hash(password)
    users[master_email]["password_hash"] = hashed
    
    # Save updated users
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)
    
    print()
    print("=" * 60)
    print("        PASSWORD CHANGED SUCCESSFULLY!")
    print("=" * 60)
    print()
    print("IMPORTANT:")
    print("1. Store your new password securely")
    print("2. Enable MFA for additional security")
    print("3. Never share your master admin credentials")
    print("4. Consider using a password manager")
    print()
    print("You can now login with your new password at:")
    print("https://sunny-stack.com/login")
    print()
    
    return True

if __name__ == "__main__":
    try:
        change_master_password()
    except Exception as e:
        print(f"ERROR: {str(e)}")
        print("Please ensure the platform has been started at least once.")