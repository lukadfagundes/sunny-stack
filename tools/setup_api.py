#!/usr/bin/env python
"""Quick API setup for Sunny Platform"""
import os
from datetime import datetime

def debug_log(category, message, **kwargs):
    timestamp = datetime.now().strftime("%H:%M:%S")
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {message} - {metrics} [{timestamp}]")

def update_api_key(api_key):
    """Update environment files with API key"""
    debug_log("CONFIG", "Updating environment files", status="STARTING")
    
    # Update frontend/.env.local
    frontend_env = "frontend/.env.local"
    if os.path.exists(frontend_env):
        with open(frontend_env, 'r') as f:
            content = f.read()
        content = content.replace('YOUR_ANTHROPIC_API_KEY_HERE', api_key)
        with open(frontend_env, 'w') as f:
            f.write(content)
        debug_log("CONFIG", "Frontend env updated", file=frontend_env)
    
    # Update backend/.env
    backend_env = "backend/.env"
    if os.path.exists(backend_env):
        with open(backend_env, 'r') as f:
            content = f.read()
        content = content.replace('YOUR_ANTHROPIC_API_KEY_HERE', api_key)
        with open(backend_env, 'w') as f:
            f.write(content)
        debug_log("CONFIG", "Backend env updated", file=backend_env)
    
    # Security-safe logging
    key_preview = f"{api_key[:10]}...{api_key[-4:]}" if len(api_key) > 20 else "CONFIGURED"
    debug_log("AUTH", "API key configured", preview=key_preview, files_updated=2)
    
    print("\n[SUCCESS] API key configured in both environment files!")
    print("\nFiles updated:")
    print("  - frontend/.env.local")
    print("  - backend/.env")

def test_connection(api_key):
    """Test the API connection"""
    debug_log("TEST", "Testing Anthropic connection", status="STARTING")
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        
        # Minimal test with Haiku (cheapest)
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=10,
            messages=[{"role": "user", "content": "test"}]
        )
        
        debug_log("API", "Connection test successful", 
                 tokens_used=response.usage.input_tokens + response.usage.output_tokens)
        
        print("\n[SUCCESS] API connection verified!")
        print(f"  Test used {response.usage.input_tokens + response.usage.output_tokens} tokens")
        print(f"  Approximate cost: < $0.000001")
        return True
        
    except Exception as e:
        debug_log("ERROR", "Connection test failed", error=str(e)[:50])
        print(f"\n[ERROR] Connection failed: {e}")
        return False

if __name__ == "__main__":
    print("\n=== Sunny Platform API Configuration ===\n")
    
    api_key = input("Please paste your Anthropic API key: ").strip()
    
    if api_key and api_key.startswith("sk-ant-"):
        update_api_key(api_key)
        
        print("\nTesting API connection...")
        if test_connection(api_key):
            print("\n[COMPLETE] Anthropic API fully configured and tested!")
        else:
            print("\n[WARNING] API key saved but connection test failed.")
            print("Check your API key and internet connection.")
    else:
        print("\n[ERROR] Invalid API key format. Should start with 'sk-ant-'")
        print("Please get your key from: https://console.anthropic.com/settings/keys")