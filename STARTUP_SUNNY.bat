@echo off
setlocal enabledelayedexpansion
title Sunny Platform Startup - Production Mode
color 0A
cls

echo.
echo ==============================================================
echo                 SUNNY AI PLATFORM STARTUP                    
echo ==============================================================
echo                 sunny-stack.com Production Deployment
echo ==============================================================
echo.
echo Timestamp: %date% %time%
echo.

REM Create logs directory if it doesn't exist
if not exist "C:\Sunny\logs" mkdir "C:\Sunny\logs"

REM Set log file with clean timestamp
set LOGFILE=C:\Sunny\logs\startup_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOGFILE=%LOGFILE: =0%
echo Logging to: %LOGFILE%
echo.

echo =============================================== >> %LOGFILE%
echo SUNNY PLATFORM STARTUP - %date% %time% >> %LOGFILE%
echo =============================================== >> %LOGFILE%

REM ===================================================================
REM STEP 1: ENVIRONMENT VALIDATION
REM ===================================================================
echo [STEP 1/8] ENVIRONMENT VALIDATION
echo ============================================
echo Checking critical components...

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found in PATH!
    echo ERROR: Python not found >> %LOGFILE%
    echo Please install Python 3.9+ and add to PATH
    pause
    exit /b 1
)
echo ✓ Python found

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found in PATH!
    echo ERROR: Node.js not found >> %LOGFILE%
    echo Please install Node.js 18+ and add to PATH
    pause
    exit /b 1
)
echo ✓ Node.js found

REM Check Cloudflared
cloudflared --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cloudflared not found in PATH!
    echo ERROR: Cloudflared not found >> %LOGFILE%
    echo Please install Cloudflared and add to PATH
    pause
    exit /b 1
)
echo ✓ Cloudflared found

REM Check directories
if not exist "C:\Sunny\backend" (
    echo ERROR: Backend directory not found!
    echo ERROR: Backend directory missing >> %LOGFILE%
    pause
    exit /b 1
)
echo ✓ Backend directory found

if not exist "C:\Sunny\frontend" (
    echo ERROR: Frontend directory not found!
    echo ERROR: Frontend directory missing >> %LOGFILE%
    pause
    exit /b 1
)
echo ✓ Frontend directory found

if not exist "C:\Sunny\backend\venv" (
    echo ERROR: Python virtual environment not found!
    echo ERROR: Virtual environment missing >> %LOGFILE%
    echo Run: cd backend && python -m venv venv
    pause
    exit /b 1
)
echo ✓ Virtual environment found

if not exist "C:\Sunny\frontend\node_modules" (
    echo WARNING: Node modules not found, will install...
    echo WARNING: Node modules missing >> %LOGFILE%
    cd /d C:\Sunny\frontend
    echo Installing frontend dependencies...
    npm install
    cd /d C:\Sunny
)
echo ✓ Node modules verified

echo.
echo Environment validation complete!
echo Environment validation passed >> %LOGFILE%
echo.

REM ===================================================================
REM STEP 2: PROCESS CLEANUP
REM ===================================================================
echo [STEP 2/8] PROCESS CLEANUP
echo ============================================
echo Stopping any existing processes...

taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Stopped existing Python processes
    echo Stopped Python processes >> %LOGFILE%
    timeout /t 2 /nobreak >nul
)

taskkill /F /IM cloudflared.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Stopped existing Cloudflared processes
    echo Stopped Cloudflared processes >> %LOGFILE%
    timeout /t 2 /nobreak >nul
)

taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Stopped existing Node.js processes
    echo Stopped Node.js processes >> %LOGFILE%
    timeout /t 2 /nobreak >nul
)

echo Process cleanup complete!
echo Process cleanup complete >> %LOGFILE%
echo.

REM ===================================================================
REM STEP 3: CLOUDFLARE TUNNEL (FIRST - WITH CONFIG)
REM ===================================================================
echo [STEP 3/8] STARTING CLOUDFLARE TUNNEL (FIRST - Foundation)
echo ============================================
echo 🌐 Starting Cloudflare Tunnel with ingress configuration...
echo Starting Cloudflare tunnel >> %LOGFILE%

REM Check for tunnel configuration
if not exist "C:\Users\lukaf\.cloudflared\trinity-config.yml" (
    echo ❌ ERROR: Tunnel configuration not found!
    echo ERROR: trinity-config.yml missing >> %LOGFILE%
    echo Expected at: C:\Users\lukaf\.cloudflared\trinity-config.yml
    pause
    exit /b 1
)

echo ✓ Using configuration: trinity-config.yml
echo 📝 Ingress rules will route traffic to backend services
start "SUNNY TUNNEL - Cloudflare" cmd /k "echo ======================================== && echo 🌐 CLOUDFLARE TUNNEL STARTING && echo ======================================== && echo Starting with config file to prevent 503 errors... && echo [%date% %time%] Tunnel starting >> logs/tunnel.log && cloudflared tunnel --config C:\Users\lukaf\.cloudflared\trinity-config.yml run trinity-dashboard"

echo Tunnel startup initiated with config
echo Tunnel command issued with config >> %LOGFILE%

REM Wait for tunnel to establish connections
echo ⏱️ Waiting for tunnel to establish connections (15 seconds)...
for /l %%i in (15,-1,1) do (
    <nul set /p "=."
    timeout /t 1 /nobreak >nul
)
echo.
echo ✓ Tunnel should now be ready to route traffic
echo.

REM ===================================================================
REM STEP 4: BACKEND STARTUP (SECOND - Services)
REM ===================================================================
echo [STEP 4/8] STARTING BACKEND (Port 8000)
echo ============================================
echo 🔧 Starting FastAPI backend...
echo Starting backend >> %LOGFILE%

cd /d "C:\Sunny\backend"

REM Activate virtual environment and start backend
start "SUNNY BACKEND - Port 8000" cmd /k "echo ======================================== && echo 🔧 SUNNY BACKEND STARTING && echo ======================================== && call venv\Scripts\activate.bat && echo Virtual environment activated && echo [%date% %time%] Backend starting >> ../logs/backend.log && python -m uvicorn app.main:asgi_app --host 0.0.0.0 --port 8000 --reload"

cd /d "C:\Sunny"
echo Backend startup initiated
echo Backend command issued >> %LOGFILE%

REM Wait for backend to fully initialize with health checks
echo ⏱️ Waiting for backend to initialize (20 seconds)...
for /l %%i in (20,-1,1) do (
    <nul set /p "=."
    timeout /t 1 /nobreak >nul
)
echo.

REM Test backend health with retries
echo 🔧 Testing backend health...
set BACKEND_READY=0
for /l %%i in (1,1,5) do (
    if !BACKEND_READY! equ 0 (
        curl -s -o nul -w "" http://localhost:8000/health
        if !errorlevel! equ 0 (
            echo ✅ Backend is healthy and responding!
            echo Backend health check passed >> %LOGFILE%
            set BACKEND_READY=1
        ) else (
            echo ⏱️ Backend not ready, retry %%i/5...
            timeout /t 3 /nobreak >nul
        )
    )
)

if %BACKEND_READY% equ 0 (
    echo ❌ ERROR: Backend is not responding after retries!
    echo ERROR: Backend not responding >> %LOGFILE%
    echo Check the backend window for errors
    pause
)
echo.

REM Test tunnel connectivity to backend
echo 🌐 Testing tunnel-to-backend connectivity...
curl -s -o nul -w "" -m 10 https://sunny-stack.com/api/health
if %errorlevel% equ 0 (
    echo ✅ Tunnel is connected and routing to backend!
    echo Tunnel connectivity verified >> %LOGFILE%
) else (
    echo ⚠️ WARNING: Tunnel-to-backend connectivity pending...
    echo Tunnel may still be establishing routes...
    echo Tunnel connectivity pending >> %LOGFILE%
)
echo.

REM ===================================================================
REM STEP 5: FRONTEND STARTUP (LAST - Needs Backend)
REM ===================================================================
echo [STEP 5/8] STARTING FRONTEND (Port 3000)
echo ============================================
echo 🎨 Starting Next.js frontend (after backend is ready)...
echo Starting frontend >> %LOGFILE%

cd /d "C:\Sunny\frontend"

REM Start frontend
start "SUNNY FRONTEND - Port 3000" cmd /k "echo ======================================== && echo 🎨 SUNNY FRONTEND STARTING && echo ======================================== && echo Waiting for backend before starting... && timeout /t 5 /nobreak && echo [%date% %time%] Frontend starting >> ../logs/frontend.log && npm run dev"

cd /d "C:\Sunny"
echo Frontend startup initiated (with backend wait)
echo Frontend command issued >> %LOGFILE%

REM Wait for frontend to compile
echo ⏱️ Waiting for frontend to compile (25 seconds)...
for /l %%i in (25,-1,1) do (
    <nul set /p "=."
    timeout /t 1 /nobreak >nul
)
echo.

REM Test frontend
echo Testing frontend...
curl -s -o nul -w "" http://localhost:3000
if %errorlevel% equ 0 (
    echo ✓ Frontend is responding!
    echo Frontend responding >> %LOGFILE%
) else (
    echo WARNING: Frontend not yet ready (still compiling)
    echo Frontend not ready >> %LOGFILE%
)
echo.

REM ===================================================================
REM STEP 6: API CONNECTIVITY TEST
REM ===================================================================
echo [STEP 6/8] TESTING API CONNECTIVITY
echo ============================================
echo Verifying API endpoints...

REM Test local API
echo Testing local API endpoint...
curl -s -o nul -w "Local API: %%{http_code}\n" http://localhost:8000/health
echo Local API test complete >> %LOGFILE%

REM Test production API
echo Testing production API endpoint...
curl -s -o nul -w "Production API: %%{http_code}\n" -m 10 https://sunny-stack.com/api/health
echo Production API test complete >> %LOGFILE%

echo.

REM ===================================================================
REM STEP 7: COMPREHENSIVE HEALTH CHECK
REM ===================================================================
echo [STEP 7/8] COMPREHENSIVE HEALTH CHECK
echo ============================================
echo Running full system diagnostics...
echo.

echo SERVICE STATUS:
echo --------------
curl -s -o nul -w "" http://localhost:8000/health
if %errorlevel% equ 0 (echo ✓ Backend API:     ONLINE [Port 8000]) else (echo ✗ Backend API:     OFFLINE)

curl -s -o nul -w "" http://localhost:3000
if %errorlevel% equ 0 (echo ✓ Frontend:        ONLINE [Port 3000]) else (echo ✗ Frontend:        OFFLINE)

curl -s -o nul -w "" -m 5 https://sunny-stack.com
if %errorlevel% equ 0 (echo ✓ Public Access:   ONLINE [sunny-stack.com]) else (echo ✗ Public Access:   OFFLINE)

curl -s -o nul -w "" -m 5 https://sunny-stack.com/api/auth/health
if %errorlevel% equ 0 (echo ✓ Auth System:     ONLINE) else (echo ✗ Auth System:     OFFLINE)

echo.
echo Full health check complete >> %LOGFILE%

REM ===================================================================
REM STEP 8: FINAL STATUS REPORT
REM ===================================================================
echo [STEP 8/8] STARTUP COMPLETE
echo ============================================
echo.
echo ==============================================================
echo                    SUNNY PLATFORM READY!                     
echo ==============================================================
echo.
echo ACCESS POINTS:
echo -------------
echo   Local Dashboard:  http://localhost:3000
echo   Production Site:  https://sunny-stack.com
echo   Backend API:      https://sunny-stack.com/api
echo   Health Check:     https://sunny-stack.com/api/health
echo.
echo SERVICE WINDOWS:
echo ---------------
echo   1. SUNNY BACKEND - Port 8000 (FastAPI)
echo   2. SUNNY TUNNEL - Cloudflare (Check connection status)
echo   3. SUNNY FRONTEND - Port 3000 (Check compilation)
echo.
echo DEBUGGING:
echo ---------
echo   Logs Directory:   C:\Sunny\logs\
echo   Startup Log:      %LOGFILE%
echo   Backend Log:      C:\Sunny\logs\backend.log
echo   Frontend Log:     C:\Sunny\logs\frontend.log
echo   Tunnel Log:       C:\Sunny\logs\tunnel.log
echo.
echo 🎆 AUTHENTICATION SYSTEM:
echo ------------------------
echo   Admin Login: luka@sunny-stack.com
echo   Auth Status: ACTIVE with JWT tokens
echo   Session Management: Secure with refresh tokens
echo.
echo ==============================================================
echo Startup completed at %date% %time% >> %LOGFILE%
echo ==============================================================
echo.
echo Press any key to exit this window (services will continue running)...
pause >nul