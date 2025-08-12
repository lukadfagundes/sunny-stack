@echo off
echo ================================================================
echo          SUNNY PLATFORM AUTHENTICATION TEST
echo ================================================================
echo.

echo [TEST 1] Checking if services are running...
curl -s -o nul -w "Backend Status: %%{http_code}\n" http://localhost:8000/api/auth/health
curl -s -o nul -w "Frontend Status: %%{http_code}\n" http://localhost:3000
echo.

echo [TEST 2] Testing unauthenticated MCP access (should fail)...
echo Attempting to access MCP status without authentication:
curl -X GET "http://localhost:8000/api/mcp/status" -H "accept: application/json"
echo.
echo Expected: 401 Unauthorized or 403 Forbidden
echo.

echo [TEST 3] Testing login endpoint...
echo Attempting login with master credentials:
curl -X POST "http://localhost:8000/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"luka@sunny-stack.com\",\"password\":\"SunnyMaster2024!\"}"
echo.
echo.

echo [TEST 4] Manual test steps:
echo.
echo 1. Open browser to: http://localhost:3000
echo    - Should redirect to login page
echo.
echo 2. Try accessing dashboard directly: http://localhost:3000/dashboard
echo    - Should redirect to login page
echo.
echo 3. Login with:
echo    Email: luka@sunny-stack.com
echo    Password: SunnyMaster2024!
echo.
echo 4. After login, verify:
echo    - Can access dashboard
echo    - MCP status loads correctly
echo    - User info displayed in header
echo.
echo 5. Test logout functionality
echo    - Should redirect to login page
echo    - Cannot access dashboard after logout
echo.
echo ================================================================
echo        AUTHENTICATION TEST COMPLETE
echo ================================================================
echo.
echo SECURITY REMINDERS:
echo [!] Change master password immediately
echo [!] Generate new JWT secret key
echo [!] Enable MFA for production
echo [!] Review audit logs regularly
echo.
pause