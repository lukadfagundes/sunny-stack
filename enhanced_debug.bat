@echo off
echo ================================================================
echo 🔍 ENHANCED SUNNY DEBUG DIAGNOSTICS
echo ================================================================
echo.

echo [CHECK 1] Directory and file validation...
echo ==========================================
echo Current directory: %CD%
echo.
echo Listing key directories and files:
dir /b backend frontend logs *.bat 2>nul
echo.

echo [CHECK 2] Process status...
echo ===========================
echo Node.js processes:
tasklist | findstr node.exe
if %errorlevel% neq 0 echo   ❌ No Node.js processes running
echo.
echo Python processes:
tasklist | findstr python.exe
if %errorlevel% neq 0 echo   ❌ No Python processes running
echo.
echo Cloudflared processes:
tasklist | findstr cloudflared.exe
if %errorlevel% neq 0 echo   ❌ No cloudflared processes running
echo.

echo [CHECK 3] Port availability...
echo ==============================
echo Checking port 8000 (Backend):
netstat -an | findstr :8000
if %errorlevel% neq 0 echo   ✅ Port 8000 available
echo.
echo Checking port 3001 (Frontend):
netstat -an | findstr :3001
if %errorlevel% neq 0 echo   ✅ Port 3001 available
echo.

echo [CHECK 4] Service connectivity...
echo =================================
echo Testing backend (http://localhost:8000/health):
curl -v http://localhost:8000/health 2>&1
echo.
echo Testing frontend (http://localhost:3001):
curl -v http://localhost:3001 2>&1
echo.

echo [CHECK 5] Tunnel configuration...
echo =================================
echo Checking for tunnel configurations:
echo.
if exist "C:\Users\lukaf\.cloudflared\sunny-config.yml" (
    echo ✅ Sunny config found at C:\Users\lukaf\.cloudflared\sunny-config.yml
    echo.
    echo Contents:
    echo ---------
    type "C:\Users\lukaf\.cloudflared\sunny-config.yml"
    echo.
) else (
    echo ❌ No sunny-config.yml found
)

if exist "C:\Users\lukaf\.cloudflared\config.yml" (
    echo ✅ Default config found at C:\Users\lukaf\.cloudflared\config.yml
    echo.
    echo Contents:
    echo ---------
    type "C:\Users\lukaf\.cloudflared\config.yml"
    echo.
) else if exist "C:\Users\lukaf\.cloudflared\config.yaml" (
    echo ✅ Default config found at C:\Users\lukaf\.cloudflared\config.yaml
    echo.
    echo Contents:
    echo ---------
    type "C:\Users\lukaf\.cloudflared\config.yaml"
    echo.
) else (
    echo ❌ No tunnel config found
)

echo [CHECK 6] Tunnel credentials...
echo ================================
echo Checking for tunnel credential files:
dir C:\Users\lukaf\.cloudflared\*.json 2>nul
echo.

echo [CHECK 7] DNS and tunnel status...
echo ==================================
echo Active tunnels:
cloudflared tunnel list 2>&1
echo.
echo DNS lookup for sunny-stack.com:
nslookup sunny-stack.com
echo.

echo [CHECK 8] Backend virtual environment...
echo =========================================
if exist "backend\venv\Scripts\python.exe" (
    echo ✅ Python virtual environment exists
    echo Testing venv Python:
    backend\venv\Scripts\python --version
) else (
    echo ❌ Python virtual environment not found
)
echo.

echo [CHECK 9] Frontend dependencies...
echo ===================================
if exist "frontend\node_modules" (
    echo ✅ Node modules directory exists
    dir frontend\node_modules | find "File(s)"
) else (
    echo ❌ Node modules not installed
)
echo.

echo [CHECK 10] Recent logs...
echo =========================
if exist "logs" (
    echo Recent log files:
    dir logs\*.log /o-d 2>nul | findstr /i ".log"
    echo.
    echo Latest startup log entries:
    for /f "tokens=*" %%f in ('dir logs\startup*.log /b /o-d 2^>nul') do (
        echo From logs\%%f:
        type "logs\%%f" | findstr /i "error warning" 2>nul
        goto :done_logs
    )
    :done_logs
) else (
    echo No logs directory found
)
echo.

echo [CHECK 11] System PATH check...
echo ================================
echo Checking for required tools in PATH:
where python >nul 2>&1
if %errorlevel% equ 0 (echo ✅ Python found) else (echo ❌ Python not in PATH)
where node >nul 2>&1
if %errorlevel% equ 0 (echo ✅ Node.js found) else (echo ❌ Node.js not in PATH)
where npm >nul 2>&1
if %errorlevel% equ 0 (echo ✅ NPM found) else (echo ❌ NPM not in PATH)
where cloudflared >nul 2>&1
if %errorlevel% equ 0 (echo ✅ Cloudflared found) else (echo ❌ Cloudflared not in PATH)
where curl >nul 2>&1
if %errorlevel% equ 0 (echo ✅ Curl found) else (echo ❌ Curl not in PATH)
echo.

echo [CHECK 12] Production endpoint test...
echo =======================================
echo Testing https://sunny-stack.com:
curl -I -m 10 https://sunny-stack.com 2>&1
echo.
echo Testing https://sunny-stack.com/api/health:
curl -s -m 10 https://sunny-stack.com/api/health 2>&1
echo.

echo ================================================================
echo 📊 DIAGNOSTIC SUMMARY
echo ================================================================
echo Diagnostics complete. Review the output above for any issues.
echo.
echo Common fixes:
echo - If ports are in use: Run .\STOP_SUNNY.bat first
echo - If venv missing: cd backend && python -m venv venv
echo - If node_modules missing: cd frontend && npm install
echo - If tunnel fails: Check credentials in C:\Users\lukaf\.cloudflared\
echo.
echo Press any key to exit...
pause >nul