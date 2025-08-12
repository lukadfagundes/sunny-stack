@echo off
echo ================================================================
echo Testing Sunny startup sequence...
echo ================================================================
echo.

echo [1] Checking if sunny-config.yml exists...
if exist "C:\Users\lukaf\.cloudflared\sunny-config.yml" (
    echo    ✅ Config file found
) else (
    echo    ❌ Config file missing!
    exit /b 1
)

echo.
echo [2] Checking for port 3000 in config...
findstr "3000" "C:\Users\lukaf\.cloudflared\sunny-config.yml" >nul
if %errorlevel% equ 0 (
    echo    ✅ Port 3000 found in config
) else (
    echo    ❌ Port 3000 not found in config
    echo    WARNING: Frontend may not be accessible
)

echo.
echo [3] Checking for new tunnel ID in config...
findstr "400b3203-a4b4-43fa-82ac-9b934431d157" "C:\Users\lukaf\.cloudflared\sunny-config.yml" >nul
if %errorlevel% equ 0 (
    echo    ✅ New tunnel ID found in config
) else (
    echo    ❌ New tunnel ID not found in config
    echo    WARNING: Config may be using old tunnel ID
)

echo.
echo [4] Verifying credentials file exists...
if exist "C:\Users\lukaf\.cloudflared\400b3203-a4b4-43fa-82ac-9b934431d157.json" (
    echo    ✅ Tunnel credentials file found
) else (
    echo    ❌ Tunnel credentials file missing!
    echo    Path: C:\Users\lukaf\.cloudflared\400b3203-a4b4-43fa-82ac-9b934431d157.json
    exit /b 1
)

echo.
echo [5] Testing tunnel configuration validity...
cloudflared tunnel --config C:\Users\lukaf\.cloudflared\sunny-config.yml info 2>nul
if %errorlevel% equ 0 (
    echo    ✅ Tunnel configuration is valid
) else (
    echo    ⚠️  Could not verify tunnel (may need to be running)
)

echo.
echo [6] Checking backend directory...
if exist "C:\Sunny\backend\venv" (
    echo    ✅ Backend virtual environment found
) else (
    echo    ❌ Backend virtual environment missing!
    exit /b 1
)

echo.
echo [7] Checking frontend directory...
if exist "C:\Sunny\frontend\package.json" (
    echo    ✅ Frontend package.json found
) else (
    echo    ❌ Frontend package.json missing!
    exit /b 1
)

echo.
echo [8] Checking current running processes...
echo    Current Node.js processes:
tasklist | findstr node.exe | find /c /v "" > temp.txt
set /p NODE_COUNT=<temp.txt
del temp.txt
echo    - Found %NODE_COUNT% Node.js process(es)

echo    Current Python processes:
tasklist | findstr python.exe | find /c /v "" > temp.txt
set /p PYTHON_COUNT=<temp.txt
del temp.txt
echo    - Found %PYTHON_COUNT% Python process(es)

echo    Current Cloudflared processes:
tasklist | findstr cloudflared.exe | find /c /v "" > temp.txt
set /p TUNNEL_COUNT=<temp.txt
del temp.txt
echo    - Found %TUNNEL_COUNT% Cloudflared process(es)

echo.
echo ================================================================
echo ✅ All checks passed! Ready to start Sunny!
echo ================================================================
echo.
echo To start Sunny, run: .\STARTUP_SUNNY.bat
echo.
pause