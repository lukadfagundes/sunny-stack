"""
Test Security Implementation
Tests bot protection, rate limiting, and authentication
"""

import requests
import time
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_blocked_paths():
    """Test that malicious paths are blocked"""
    print("\n=== Testing Blocked Paths ===")
    
    blocked_paths = [
        "/wordpress/wp-admin",
        "/wp-login.php",
        "/admin/config.php",
        "/phpmyadmin",
        "/.env",
        "/.git/config",
        "/backup.sql",
        "/shell.php"
    ]
    
    for path in blocked_paths:
        try:
            response = requests.get(f"{BASE_URL}{path}", timeout=5)
            print(f"Path: {path} - Status: {response.status_code}")
            
            if response.status_code == 404:
                print(f"  ✓ Path blocked (returned 404 to hide structure)")
            elif response.status_code == 403:
                print(f"  ✓ Path blocked (returned 403 forbidden)")
            else:
                print(f"  ✗ WARNING: Path not blocked! Status: {response.status_code}")
        except Exception as e:
            print(f"Path: {path} - Error: {e}")

def test_suspicious_user_agents():
    """Test that suspicious user agents are blocked"""
    print("\n=== Testing Suspicious User Agents ===")
    
    suspicious_agents = [
        "sqlmap/1.0",
        "nikto/2.1.5",
        "python-requests/2.28.0",
        "curl/7.68.0",
        "Nmap Scripting Engine"
    ]
    
    for agent in suspicious_agents:
        try:
            headers = {"User-Agent": agent}
            response = requests.get(f"{BASE_URL}/api/health", headers=headers, timeout=5)
            print(f"User-Agent: {agent}")
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 403:
                print(f"  ✓ Suspicious agent blocked")
            else:
                print(f"  ✗ WARNING: Agent not blocked!")
        except Exception as e:
            print(f"User-Agent: {agent} - Error: {e}")

def test_rate_limiting():
    """Test rate limiting functionality"""
    print("\n=== Testing Rate Limiting ===")
    
    # Test login endpoint rate limit (5 per minute)
    print("\nTesting login rate limit (5 attempts per minute):")
    
    for i in range(7):
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": "test@test.com", "password": "wrong"},
                timeout=5
            )
            print(f"Attempt {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"  ✓ Rate limit triggered after {i+1} attempts")
                retry_after = response.headers.get("Retry-After")
                print(f"  Retry-After: {retry_after} seconds")
                break
        except Exception as e:
            print(f"Attempt {i+1}: Error - {e}")
        
        time.sleep(0.5)  # Small delay between requests

def test_sql_injection_detection():
    """Test SQL injection detection"""
    print("\n=== Testing SQL Injection Detection ===")
    
    sql_payloads = [
        "' OR '1'='1",
        "admin'--",
        "1; DROP TABLE users;",
        "' UNION SELECT * FROM users--"
    ]
    
    for payload in sql_payloads:
        try:
            response = requests.get(
                f"{BASE_URL}/api/health",
                params={"search": payload},
                timeout=5
            )
            print(f"Payload: {payload[:30]}...")
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 400:
                print(f"  ✓ SQL injection attempt blocked")
            else:
                print(f"  Status: {response.status_code}")
        except Exception as e:
            print(f"Payload: {payload[:30]}... - Error: {e}")

def test_xss_detection():
    """Test XSS detection"""
    print("\n=== Testing XSS Detection ===")
    
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "javascript:alert(1)",
        "<img src=x onerror=alert(1)>",
        "<iframe src='javascript:alert(1)'>"
    ]
    
    for payload in xss_payloads:
        try:
            response = requests.get(
                f"{BASE_URL}/api/health",
                params={"input": payload},
                timeout=5
            )
            print(f"Payload: {payload[:30]}...")
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 400:
                print(f"  ✓ XSS attempt blocked")
            else:
                print(f"  Status: {response.status_code}")
        except Exception as e:
            print(f"Payload: {payload[:30]}... - Error: {e}")

def test_security_headers():
    """Test that security headers are present"""
    print("\n=== Testing Security Headers ===")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        
        important_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Referrer-Policy",
            "Content-Security-Policy",
            "Strict-Transport-Security"
        ]
        
        for header in important_headers:
            value = response.headers.get(header)
            if value:
                print(f"✓ {header}: {value}")
            else:
                print(f"✗ {header}: Missing!")
        
        # Check server header is masked
        server = response.headers.get("Server")
        if server and server != "Sunny-Platform":
            print(f"⚠ Server header not masked: {server}")
        else:
            print(f"✓ Server header masked: {server}")
            
    except Exception as e:
        print(f"Error testing headers: {e}")

def test_authentication_wall():
    """Test that all protected endpoints require authentication"""
    print("\n=== Testing Authentication Wall ===")
    
    protected_endpoints = [
        "/api/projects",
        "/api/analysis",
        "/api/proposals",
        "/api/metrics",
        "/api/mcp/files/write",
        "/api/self-improvement"
    ]
    
    for endpoint in protected_endpoints:
        try:
            # Test without auth
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            print(f"Endpoint: {endpoint}")
            print(f"  Without auth: Status {response.status_code}")
            
            if response.status_code == 401:
                print(f"  ✓ Authentication required")
            else:
                print(f"  ✗ WARNING: Endpoint accessible without auth!")
            
        except Exception as e:
            print(f"Endpoint: {endpoint} - Error: {e}")

def main():
    """Run all security tests"""
    print("=" * 60)
    print("SECURITY IMPLEMENTATION TEST SUITE")
    print(f"Testing: {BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Run tests
    test_blocked_paths()
    test_suspicious_user_agents()
    test_rate_limiting()
    test_sql_injection_detection()
    test_xss_detection()
    test_security_headers()
    test_authentication_wall()
    
    print("\n" + "=" * 60)
    print("SECURITY TESTS COMPLETED")
    print("Check logs/security_threats.json for logged threats")
    print("Check logs/rate_limits.json for rate limit violations")
    print("=" * 60)

if __name__ == "__main__":
    main()