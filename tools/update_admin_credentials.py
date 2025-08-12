"""
Update Admin Credentials Script
Updates the admin email and password for Sunny platform
"""

import bcrypt
import os
import sys
from pathlib import Path
from dotenv import load_dotenv, set_key

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

def hash_password(password: str) -> str:
    """Hash a password using bcrypt with cost factor 12"""
    # Use cost factor 12 for secure hashing
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def update_admin_credentials():
    """Update admin email and password in .env file"""
    
    # New credentials
    NEW_ADMIN_EMAIL = "luka@sunny-stack.com"
    NEW_ADMIN_PASSWORD = "S@m3fweak"
    
    print("=" * 60)
    print("UPDATING ADMIN CREDENTIALS")
    print("=" * 60)
    
    # Hash the new password
    print(f"\n1. Hashing new password with bcrypt (cost factor 12)...")
    new_password_hash = hash_password(NEW_ADMIN_PASSWORD)
    print(f"   [OK] Password hashed successfully")
    
    # Update .env file
    env_path = Path(__file__).parent / "backend" / ".env"
    print(f"\n2. Updating .env file at: {env_path}")
    
    if not env_path.exists():
        print(f"   [ERROR] Error: .env file not found at {env_path}")
        return False
    
    # Load existing .env
    load_dotenv(env_path)
    
    # Update values
    set_key(env_path, "ADMIN_EMAIL", NEW_ADMIN_EMAIL)
    set_key(env_path, "ADMIN_PASSWORD_HASH", new_password_hash)
    
    print(f"   [OK] Updated ADMIN_EMAIL to: {NEW_ADMIN_EMAIL}")
    print(f"   [OK] Updated ADMIN_PASSWORD_HASH")
    
    # Verify the hash works
    print(f"\n3. Verifying password hash...")
    if verify_password(NEW_ADMIN_PASSWORD, new_password_hash):
        print(f"   [OK] Password verification successful")
    else:
        print(f"   [ERROR] Password verification failed!")
        return False
    
    # Update auth system's user database
    users_file = Path(__file__).parent / "backend" / "data" / "users.json"
    if users_file.exists():
        import json
        print(f"\n4. Updating users database...")
        
        with open(users_file, 'r') as f:
            users = json.load(f)
        
        # Update or create admin user
        admin_found = False
        for user in users:
            if user.get("email") in ["admin@sunny-stack.com", NEW_ADMIN_EMAIL]:
                user["email"] = NEW_ADMIN_EMAIL
                user["password_hash"] = new_password_hash
                user["role"] = "master_admin"
                user["name"] = "Luka"
                admin_found = True
                print(f"   [OK] Updated existing admin user")
                break
        
        if not admin_found:
            # Create new admin user
            users.append({
                "id": "admin_001",
                "email": NEW_ADMIN_EMAIL,
                "password_hash": new_password_hash,
                "role": "master_admin",
                "name": "Luka",
                "created_at": "2025-01-01T00:00:00Z",
                "is_active": True,
                "permissions": ["*"]
            })
            print(f"   [OK] Created new admin user")
        
        # Save updated users
        with open(users_file, 'w') as f:
            json.dump(users, f, indent=2)
        print(f"   [OK] Users database updated")
    else:
        print(f"\n4. Creating users database...")
        users_file.parent.mkdir(exist_ok=True)
        
        users = [{
            "id": "admin_001",
            "email": NEW_ADMIN_EMAIL,
            "password_hash": new_password_hash,
            "role": "master_admin",
            "name": "Luka",
            "created_at": "2025-01-01T00:00:00Z",
            "is_active": True,
            "permissions": ["*"]
        }]
        
        with open(users_file, 'w') as f:
            json.dump(users, f, indent=2)
        print(f"   [OK] Users database created with admin user")
    
    print("\n" + "=" * 60)
    print("CREDENTIALS UPDATE COMPLETE")
    print("=" * 60)
    print(f"\nNew Admin Credentials:")
    print(f"  Email: {NEW_ADMIN_EMAIL}")
    print(f"  Password: {NEW_ADMIN_PASSWORD}")
    print(f"\nYou can now login at https://sunny-stack.com with these credentials")
    print("\nSecurity Notes:")
    print("  - Password is hashed with bcrypt (cost factor 12)")
    print("  - .env file updated with new credentials")
    print("  - Users database synchronized")
    print("  - Clear browser cache if login issues occur")
    
    return True

if __name__ == "__main__":
    success = update_admin_credentials()
    sys.exit(0 if success else 1)