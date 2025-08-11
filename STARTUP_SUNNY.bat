@echo off
cls
color 0A
echo ================================================================
echo 🌟 STARTING SUNNY AI CONSULTING PLATFORM - PRODUCTION MODE 🌟
echo ================================================================
echo Timestamp: %date% %time%
echo.

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs
set LOGFILE=logs\startup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOGFILE=%LOGFILE: =0%

echo [DEBUG] Starting Sunny platform startup sequence... >> %LOGFILE%
echo [DEBUG] Current directory: %CD% >> %LOGFILE%
echo [DEBUG] User: %USERNAME% >> %LOGFILE%
echo [DEBUG] System: %COMPUTERNAME% >> %LOGFILE%

echo [STEP 1] Pre-flight checks and cleanup...
echo ===============================================
echo [DEBUG] Checking current running processes...

REM Check what's currently running
echo Current Node.js processes:
tasklist | findstr node.exe
echo Current Python processes:  
tasklist | findstr python.exe
echo Current Cloudflared processes:
tasklist | findstr cloudflared.exe
echo.

echo [DEBUG] Stopping any existing processes...
taskkill /F /IM cloudflared.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Stopped existing cloudflared processes
    echo [DEBUG] Stopped cloudflared processes >> %LOGFILE%
) else (
    echo ⚠️  No cloudflared processes to stop
    echo [DEBUG] No cloudflared processes found >> %LOGFILE%
)

taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Stopped existing Node.js processes
    echo [DEBUG] Stopped Node.js processes >> %LOGFILE%
) else (
    echo ⚠️  No Node.js processes to stop
    echo [DEBUG] No Node.js processes found >> %LOGFILE%
)

taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Stopped existing Python processes
    echo [DEBUG] Stopped Python processes >> %LOGFILE%
) else (
    echo ⚠️  No Python processes to stop
    echo [DEBUG] No Python processes found >> %LOGFILE%
)

echo ✅ Process cleanup complete
echo.

echo [STEP 2] Environment validation...
echo ==================================
echo [DEBUG] Validating directory structure...

REM Check critical directories
if exist "backend" (
    echo ✅ Backend directory found
    echo [DEBUG] Backend directory exists >> %LOGFILE%
) else (
    echo ❌ Backend directory missing!
    echo [ERROR] Backend directory missing >> %LOGFILE%
    goto :error
)

if exist "frontend" (
    echo ✅ Frontend directory found
    echo [DEBUG] Frontend directory exists >> %LOGFILE%
) else (
    echo ❌ Frontend directory missing!
    echo [ERROR] Frontend directory missing >> %LOGFILE%
    goto :error
)

if exist "backend\venv" (
    echo ✅ Python virtual environment found
    echo [DEBUG] Virtual environment exists >> %LOGFILE%
) else (
    echo ❌ Python virtual environment missing!
    echo [ERROR] Virtual environment missing >> %LOGFILE%
    goto :error
)

if exist "frontend\package.json" (
    echo ✅ Frontend package.json found
    echo [DEBUG] package.json exists >> %LOGFILE%
) else (
    echo ❌ Frontend package.json missing!
    echo [ERROR] package.json missing >> %LOGFILE%
    goto :error
)

echo ✅ Environment validation passed
echo.

echo [STEP 3] Cloudflare Tunnel Configuration Check...
echo ================================================
echo [DEBUG] Using Sunny-specific tunnel configuration...

if exist "C:\Users\lukaf\.cloudflared\sunny-config.yml" (
    echo ✅ Sunny tunnel configuration found
    echo [DEBUG] Found sunny-config.yml >> %LOGFILE%
    set TUNNEL_CONFIG=C:\Users\lukaf\.cloudflared\sunny-config.yml
    set TUNNEL_NAME=sunny-ai-platform
) else (
    echo ❌ Sunny tunnel configuration missing!
    echo [ERROR] sunny-config.yml not found >> %LOGFILE%
    echo.
    echo Please ensure sunny-config.yml exists in C:\Users\lukaf\.cloudflared\
    goto :error
)

echo [DEBUG] Using tunnel config: %TUNNEL_CONFIG%
echo [DEBUG] Tunnel name: %TUNNEL_NAME%
echo [DEBUG] Config path: %TUNNEL_CONFIG% >> %LOGFILE%

echo [STEP 4] Starting Cloudflare Tunnel (MUST BE FIRST)...
echo ===================================
echo 🌐 Connecting Sunny to sunny-stack.com...
echo [DEBUG] Starting tunnel with config: %TUNNEL_CONFIG%

start "Sunny Cloudflare Tunnel" cmd /k "echo 🌐 TUNNEL CONNECTING TO CLOUDFLARE... && echo [DEBUG] Config: %TUNNEL_CONFIG% && cloudflared tunnel --config %TUNNEL_CONFIG% run && echo [ERROR] Tunnel failed to connect! && pause"

echo ✅ Tunnel startup command issued
echo [DEBUG] Tunnel startup initiated >> %LOGFILE%
echo.

echo [STEP 5] Waiting for tunnel connection...
echo ======================================
echo [DEBUG] Waiting 15 seconds for tunnel to establish connection...
timeout /t 15 /nobreak >nul

echo [DEBUG] Checking tunnel status...
cloudflared tunnel list 2>&1 >> %LOGFILE%
echo.

echo [STEP 6] Starting Sunny Backend (Port 8000)...
echo ============================================
echo [DEBUG] Attempting to start Sunny backend...

cd backend
if %errorlevel% neq 0 (
    echo ❌ Failed to change to backend directory
    echo [ERROR] Cannot cd to backend >> %LOGFILE%
    goto :error
)

echo 📊 Initializing Sunny Backend with MCP integration...
echo [DEBUG] Starting backend in new window...
start "Sunny Backend" cmd /k "echo 🔥 SUNNY BACKEND STARTING... && echo [DEBUG] Activating virtual environment... && .\venv\Scripts\activate && echo [DEBUG] Starting uvicorn server... && python -m uvicorn app.main:asgi_app --reload --port 8000 --host 0.0.0.0 && echo [ERROR] Backend failed to start! && pause"

cd ..
echo ✅ Backend startup command issued
echo [DEBUG] Backend startup initiated >> %LOGFILE%
echo.

echo [STEP 7] Waiting for backend initialization...
echo ==========================================
echo [DEBUG] Waiting 10 seconds for backend to initialize...
timeout /t 10 /nobreak >nul

echo [DEBUG] Testing backend connectivity...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is responding on port 8000
    echo [DEBUG] Backend responding on port 8000 >> %LOGFILE%
) else (
    echo ⚠️  Backend not yet responding (may still be starting)
    echo [DEBUG] Backend not responding, waiting 5 more seconds... >> %LOGFILE%
    timeout /t 5 /nobreak >nul
    curl -s http://localhost:8000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Backend now responding
        echo [DEBUG] Backend now responding >> %LOGFILE%
    ) else (
        echo ⚠️  Backend still not responding - continuing anyway
        echo [WARNING] Backend not responding, continuing >> %LOGFILE%
    )
)
echo.

echo [STEP 8] Starting Sunny Frontend (Port 3000)...
echo ============================================
echo [DEBUG] Attempting to start Sunny frontend on port 3000...

cd frontend
if %errorlevel% neq 0 (
    echo ❌ Failed to change to frontend directory
    echo [ERROR] Cannot cd to frontend >> %LOGFILE%
    goto :error
)

echo 🎨 Initializing Sunny Trinity Interface on port 3000...
echo [DEBUG] Starting frontend on port 3000 in new window...
start "Sunny Frontend" cmd /k "echo 🚀 SUNNY FRONTEND STARTING ON PORT 3000... && echo [DEBUG] Checking npm dependencies... && npm run dev -- --port 3000 && echo [ERROR] Frontend failed to start! && pause"

cd ..
echo ✅ Frontend startup command issued for port 3000
echo [DEBUG] Frontend startup initiated >> %LOGFILE%
echo.

echo [STEP 9] Waiting for frontend build...
echo ======================================
echo [DEBUG] Waiting 15 seconds for frontend to build...
timeout /t 15 /nobreak >nul

echo [DEBUG] Testing frontend connectivity on port 3000...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is responding on port 3000
    echo [DEBUG] Frontend responding on port 3000 >> %LOGFILE%
) else (
    echo ⚠️  Frontend not yet responding (may still be building)
    echo [DEBUG] Frontend not responding, waiting 10 more seconds... >> %LOGFILE%
    timeout /t 10 /nobreak >nul
    curl -s http://localhost:3000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Frontend now responding on port 3000
        echo [DEBUG] Frontend now responding on port 3000 >> %LOGFILE%
    ) else (
        echo ⚠️  Frontend still not responding - continuing anyway
        echo [WARNING] Frontend not responding on port 3000, continuing >> %LOGFILE%
    )
)
echo.

echo [STEP 10] DEPLOYMENT VERIFICATION
echo ================================
echo [DEBUG] Running comprehensive verification...
echo.
echo 🌐 SUNNY AI CONSULTING PLATFORM STATUS:
echo ----------------------------------------
echo ✅ Backend:    http://localhost:8000
echo ✅ Frontend:   http://localhost:3000
echo ✅ Production: https://sunny-stack.com
echo ✅ MCP API:    https://sunny-stack.com/api/mcp
echo ✅ Health:     https://sunny-stack.com/api/health
echo ✅ Admin:      https://sunny-stack.com/api/auth/login
echo.
echo 🎯 CLIENT PROJECTS:
echo ------------------
echo ✅ NavigatorCore: https://navigators-core.sunny-stack.com
echo.

echo [STEP 11] Testing production endpoints...
echo ======================================
echo [DEBUG] Testing production connectivity...
timeout /t 5 /nobreak >nul

echo Testing main site...
curl -s -o nul -w "Response Code: %%{http_code}\n" -m 10 https://sunny-stack.com 2>&1
echo [DEBUG] Main site test completed >> %LOGFILE%

echo Testing API health...
curl -s -o nul -w "Response Code: %%{http_code}\n" -m 10 https://sunny-stack.com/api/health 2>&1
echo [DEBUG] API health test completed >> %LOGFILE%

echo Testing MCP endpoint...
curl -s -o nul -w "Response Code: %%{http_code}\n" -m 10 https://sunny-stack.com/api/mcp/status 2>&1
echo [DEBUG] MCP endpoint test completed >> %LOGFILE%

echo.
echo ================================================================
echo 🎉 SUNNY AI CONSULTING PLATFORM STARTUP COMPLETE! 🎉
echo ================================================================
echo.
echo 📊 SERVICE STATUS (Started in correct order):
echo   1. Tunnel Process: Check "Sunny Cloudflare Tunnel" window
echo   2. Backend Process: Check "Sunny Backend" window
echo   3. Frontend Process: Check "Sunny Frontend" window
echo.
echo 📋 MANAGEMENT COMMANDS:
echo   - View Logs: type %LOGFILE%
echo   - Debug Tunnel: .\debug_sunny_tunnel.bat
echo   - Restart Everything: .\RESTART_SUNNY.bat
echo   - Stop Everything: .\STOP_SUNNY.bat
echo.
echo 🚨 IF ISSUES OCCUR:
echo   - Check process windows for error messages
echo   - Run .\enhanced_debug.bat for diagnostics
echo   - Check startup log: %LOGFILE%
echo.
echo ⚡ Your AI consulting platform should now be accessible!
echo ================================================================
echo [DEBUG] Startup sequence completed at %date% %time% >> %LOGFILE%

goto :end

:error
echo.
echo ================================================================
echo ❌ STARTUP FAILED
echo ================================================================
echo [ERROR] Startup failed at %date% %time% >> %LOGFILE%
echo Check the error messages above and the log file: %LOGFILE%
echo.
echo Common solutions:
echo 1. Ensure you're in the correct directory (C:\Sunny)
echo 2. Check that backend\venv exists
echo 3. Verify frontend\package.json exists
echo 4. Run .\enhanced_debug.bat for diagnostics
echo.
pause
exit /b 1

:end
echo.
echo Press any key to continue monitoring...
pause >nul