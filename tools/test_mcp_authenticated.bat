@echo off
echo ================================================================
echo MCP SERVICE AUTHENTICATED TEST
echo ================================================================
echo.

echo [1] Getting authentication token...
echo Please enter your login credentials:
echo.
set /p EMAIL="Email: "
set /p PASSWORD="Password: "

echo.
echo Authenticating...
for /f "tokens=*" %%i in ('curl -s -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\"}" ^| findstr "access_token"') do set TOKEN_LINE=%%i

REM Extract token from JSON response
for /f "tokens=2 delims=:" %%a in ("%TOKEN_LINE%") do set TOKEN_WITH_QUOTES=%%a
set TOKEN=%TOKEN_WITH_QUOTES:~1,-2%

if "%TOKEN%"=="" (
    echo Authentication failed!
    pause
    exit /b 1
)

echo Authentication successful!
echo.

echo [2] Testing MCP endpoints with authentication...
echo.

echo Testing /api/mcp/status:
curl -s -H "Authorization: Bearer %TOKEN%" http://localhost:8000/api/mcp/status
echo.
echo.

echo Testing /api/mcp/logs:
curl -s -H "Authorization: Bearer %TOKEN%" "http://localhost:8000/api/mcp/logs?count=5"
echo.
echo.

echo Testing /api/mcp/project/structure:
curl -s -H "Authorization: Bearer %TOKEN%" "http://localhost:8000/api/mcp/project/structure?max_depth=2"
echo.
echo.

echo ================================================================
echo MCP AUTHENTICATED TEST COMPLETE
echo ================================================================
echo.
pause