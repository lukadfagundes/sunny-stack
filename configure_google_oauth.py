#!/usr/bin/env python
"""Configure Google OAuth for Sunny Platform"""
import os
from datetime import datetime

def debug_log(category, message, **kwargs):
    timestamp = datetime.now().strftime("%H:%M:%S")
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {message} - {metrics} [{timestamp}]")

def update_google_credentials(client_id, client_secret):
    """Update environment files with Google OAuth credentials"""
    debug_log("CONFIG", "Updating Google OAuth credentials", status="STARTING")
    
    # Update frontend/.env.local
    frontend_env = "frontend/.env.local"
    if os.path.exists(frontend_env):
        with open(frontend_env, 'r') as f:
            content = f.read()
        content = content.replace('YOUR_GOOGLE_CLIENT_ID_HERE', client_id)
        content = content.replace('YOUR_GOOGLE_CLIENT_SECRET_HERE', client_secret)
        with open(frontend_env, 'w') as f:
            f.write(content)
        debug_log("CONFIG", "Frontend env updated", file=frontend_env)
    
    # Update backend/.env
    backend_env = "backend/.env"
    if os.path.exists(backend_env):
        with open(backend_env, 'r') as f:
            content = f.read()
        content = content.replace('YOUR_GOOGLE_CLIENT_ID_HERE', client_id)
        content = content.replace('YOUR_GOOGLE_CLIENT_SECRET_HERE', client_secret)
        with open(backend_env, 'w') as f:
            f.write(content)
        debug_log("CONFIG", "Backend env updated", file=backend_env)
    
    # Security-safe logging
    client_preview = f"{client_id[:20]}...apps.googleusercontent.com" if len(client_id) > 30 else "CONFIGURED"
    secret_preview = f"{client_secret[:10]}..." if len(client_secret) > 10 else "CONFIGURED"
    
    debug_log("AUTH", "Google OAuth configured", 
             client_id_preview=client_preview,
             secret_preview=secret_preview,
             files_updated=2)
    
    print("\n[SUCCESS] Google OAuth credentials configured!")
    print("\nFiles updated:")
    print("  - frontend/.env.local")
    print("  - backend/.env")

if __name__ == "__main__":
    print("\n=== Sunny Platform Google OAuth Configuration ===\n")
    
    client_id = input("Google Client ID: ").strip()
    client_secret = input("Google Client Secret: ").strip()
    
    if client_id and client_secret:
        update_google_credentials(client_id, client_secret)
        print("\n[COMPLETE] Google OAuth configured successfully!")
        print("\nYou can now use Google sign-in for authentication!")
    else:
        print("\n[ERROR] Both Client ID and Secret are required")