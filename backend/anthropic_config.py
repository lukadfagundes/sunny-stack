#!/usr/bin/env python
"""
Anthropic API Configuration Helper for Sunny Platform
DEBUG AUTH: Dual API key management - Max Plan + API Credits
"""

import os
from datetime import datetime
from dotenv import load_dotenv

def debug_log(category, message, **kwargs):
    """Security-safe debug logging"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {message} - {metrics} [{timestamp}]")

def test_anthropic_connection(api_key=None):
    """Test Anthropic API connection"""
    debug_log("API", "Testing Anthropic connection", status="STARTING")
    
    try:
        import anthropic
        
        # Use provided key or from environment
        key = api_key or os.getenv("ANTHROPIC_API_KEY")
        
        if not key:
            debug_log("ERROR", "No API key provided", status="MISSING")
            return False
        
        # Security-safe logging
        key_preview = f"{key[:10]}...{key[-4:]}" if len(key) > 20 else "INVALID"
        debug_log("AUTH", "Using API key", preview=key_preview, length=len(key))
        
        # Initialize client
        client = anthropic.Anthropic(api_key=key)
        
        # Test with minimal token usage
        response = client.messages.create(
            model="claude-3-haiku-20240307",  # Cheapest model for testing
            max_tokens=10,
            messages=[{"role": "user", "content": "Hi"}]
        )
        
        debug_log("API", "Anthropic connection successful", 
                 model="haiku", 
                 response_length=len(response.content[0].text),
                 usage_input=response.usage.input_tokens,
                 usage_output=response.usage.output_tokens)
        
        # Calculate approximate cost
        input_cost = response.usage.input_tokens * 0.00025 / 1000  # $0.25 per million
        output_cost = response.usage.output_tokens * 0.00125 / 1000  # $1.25 per million
        
        debug_log("PERFORMANCE", "Test cost", 
                 input_tokens=response.usage.input_tokens,
                 output_tokens=response.usage.output_tokens,
                 estimated_cost_usd=f"${input_cost + output_cost:.6f}")
        
        return True
        
    except anthropic.APIError as e:
        debug_log("ERROR", "API error", type="APIError", status_code=getattr(e, 'status_code', 'unknown'))
        print(f"\n❌ API Error: {e.message if hasattr(e, 'message') else str(e)}")
        return False
    except Exception as e:
        debug_log("ERROR", "Connection failed", type=type(e).__name__)
        print(f"\n❌ Error: {str(e)}")
        return False

def configure_api_keys():
    """Guide user through API key configuration"""
    print("\n🔑 Anthropic API Configuration\n")
    print("DEBUG CONFIG: Starting API key setup\n")
    
    print("You have TWO options for API keys:\n")
    print("1. Production API Key (Recommended for Sunny)")
    print("   - Uses your $3/$15 API credits")
    print("   - Get from: https://console.anthropic.com/settings/keys")
    print("   - Best for: Production use, client projects\n")
    
    print("2. Max Plan via Claude.ai (Alternative)")
    print("   - Uses your Max plan subscription")
    print("   - Note: Max plan doesn't provide direct API access")
    print("   - You still need an API key for Sunny to work\n")
    
    print("📋 Steps to get your API key:")
    print("1. Go to: https://console.anthropic.com/settings/keys")
    print("2. Click 'Create Key'")
    print("3. Name it: 'Sunny Platform Production'")
    print("4. Copy the key (starts with sk-ant-api03-...)")
    print("5. Keep it secure - you won't see it again!\n")
    
    api_key = input("Paste your Anthropic API key here (or press Enter to skip): ").strip()
    
    if api_key:
        debug_log("AUTH", "API key received", length=len(api_key), starts_with=api_key[:10] if len(api_key) > 10 else "invalid")
        
        print("\n🧪 Testing API connection...")
        if test_anthropic_connection(api_key):
            print("✅ API connection successful!\n")
            
            # Update environment files
            update_env_files(api_key)
            
            print("\n📊 API Pricing Reminder:")
            print("   Claude 3.5 Sonnet: $3/million input, $15/million output")
            print("   Claude 3 Haiku: $0.25/million input, $1.25/million output")
            print("   Your test just cost approximately $0.000001\n")
            
            return api_key
        else:
            print("\n⚠️ API connection failed. Please check your key and try again.")
            return None
    else:
        print("\n⏭️ Skipping API configuration for now.")
        print("   You'll need to add it manually to:")
        print("   - frontend/.env.local")
        print("   - backend/.env")
        return None

def update_env_files(api_key):
    """Update environment files with API key"""
    debug_log("CONFIG", "Updating environment files", status="STARTING")
    
    # Update frontend/.env.local
    frontend_env_path = "frontend/.env.local"
    if os.path.exists(frontend_env_path):
        with open(frontend_env_path, 'r') as f:
            content = f.read()
        
        content = content.replace('YOUR_ANTHROPIC_API_KEY_HERE', api_key)
        
        with open(frontend_env_path, 'w') as f:
            f.write(content)
        
        debug_log("CONFIG", "Frontend env updated", file=frontend_env_path)
    
    # Update backend/.env
    backend_env_path = "backend/.env"
    if os.path.exists(backend_env_path):
        with open(backend_env_path, 'r') as f:
            content = f.read()
        
        content = content.replace('YOUR_ANTHROPIC_API_KEY_HERE', api_key)
        
        with open(backend_env_path, 'w') as f:
            f.write(content)
        
        debug_log("CONFIG", "Backend env updated", file=backend_env_path)
    
    print("✅ Environment files updated with API key")

def estimate_monthly_usage():
    """Estimate monthly API costs for Sunny platform"""
    print("\n💰 Estimated Monthly API Usage for Sunny:\n")
    
    estimates = {
        "Development/Testing": {
            "sessions_per_day": 10,
            "tokens_per_session": 5000,
            "model": "Claude 3 Haiku",
            "input_cost_per_million": 0.25,
            "output_cost_per_million": 1.25
        },
        "Client Analysis": {
            "sessions_per_day": 5,
            "tokens_per_session": 20000,
            "model": "Claude 3.5 Sonnet", 
            "input_cost_per_million": 3.00,
            "output_cost_per_million": 15.00
        },
        "Proposal Generation": {
            "sessions_per_day": 3,
            "tokens_per_session": 15000,
            "model": "Claude 3.5 Sonnet",
            "input_cost_per_million": 3.00,
            "output_cost_per_million": 15.00
        }
    }
    
    total_monthly_cost = 0
    
    for use_case, params in estimates.items():
        daily_tokens = params["sessions_per_day"] * params["tokens_per_session"]
        monthly_tokens = daily_tokens * 30
        
        # Assume 60% input, 40% output
        input_tokens = monthly_tokens * 0.6
        output_tokens = monthly_tokens * 0.4
        
        input_cost = (input_tokens / 1_000_000) * params["input_cost_per_million"]
        output_cost = (output_tokens / 1_000_000) * params["output_cost_per_million"]
        total_cost = input_cost + output_cost
        
        total_monthly_cost += total_cost
        
        print(f"{use_case}:")
        print(f"  Model: {params['model']}")
        print(f"  Monthly tokens: {monthly_tokens:,}")
        print(f"  Estimated cost: ${total_cost:.2f}")
        print()
    
    print(f"📊 Total Estimated Monthly Cost: ${total_monthly_cost:.2f}")
    print(f"   (Well within typical client project value of $45,000+)\n")

if __name__ == "__main__":
    load_dotenv()
    
    print("\n🌟 Sunny Platform - Anthropic API Setup")
    print("=" * 50)
    
    api_key = configure_api_keys()
    
    if api_key:
        estimate_monthly_usage()
        
        print("\n✅ API Configuration Complete!")
        print("\nNext steps:")
        print("1. Configure Google OAuth")
        print("2. Set up database connections")
        print("3. Start the Trinity interface")
    else:
        print("\n⚠️ API not configured. You'll need to add it manually before using Sunny.")