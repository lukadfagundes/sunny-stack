@echo off
cls
echo ================================================================
echo    STOPPING SUNNY AI CONSULTING PLATFORM
echo ================================================================
echo.

echo [1/4] Stopping Cloudflare Tunnel...
echo ========================================
tasklist | findstr cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    taskkill /F /IM cloudflared.exe >nul 2>&1
    echo [OK] Cloudflare tunnel stopped
) else (
    echo [INFO] Cloudflare tunnel was not running
)

echo.
echo [2/4] Stopping Frontend Services...
echo ========================================
tasklist | findstr node >nul 2>&1
if %errorlevel% equ 0 (
    taskkill /F /IM node.exe >nul 2>&1
    echo [OK] Frontend services stopped
) else (
    echo [INFO] Frontend services were not running
)

echo.
echo [3/4] Stopping Backend Services...
echo ========================================
tasklist | findstr python >nul 2>&1
if %errorlevel% equ 0 (
    taskkill /F /IM python.exe >nul 2>&1
    echo [OK] Backend services stopped
) else (
    echo [INFO] Backend services were not running
)

echo.
echo [4/4] Verifying shutdown...
echo ========================================

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Verify all processes are stopped
set ALL_STOPPED=1

tasklist | findstr cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Some cloudflared processes may still be running
    set ALL_STOPPED=0
)

tasklist | findstr node >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Some node processes may still be running
    set ALL_STOPPED=0
)

tasklist | findstr python >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Some python processes may still be running
    set ALL_STOPPED=0
)

if %ALL_STOPPED% equ 1 (
    echo [OK] All Sunny processes have been stopped
) else (
    echo.
    echo [WARNING] Some processes may still be running
    echo Try running this script again or use Task Manager
)

echo.
echo ================================================================
echo    SUNNY AI PLATFORM SHUTDOWN COMPLETE
echo ================================================================
echo.
echo sunny-stack.com is now OFFLINE
echo.
echo To restart Sunny:
echo   - Run STARTUP_SUNNY.bat for full deployment
echo   - Run RESTART_SUNNY.bat for quick restart
echo.
pause