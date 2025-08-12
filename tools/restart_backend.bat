@echo off
echo ================================================================
echo RESTARTING SUNNY BACKEND
echo ================================================================
echo.

echo [1] Stopping existing backend process...
taskkill /F /FI "WINDOWTITLE eq Sunny Backend*" 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [2] Installing psutil if needed...
C:\Sunny\backend\venv\Scripts\pip.exe install psutil --quiet
echo.

echo [3] Starting backend server...
start "Sunny Backend" cmd /k "cd /d C:\Sunny\backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo.

echo [4] Waiting for server to start...
timeout /t 5 /nobreak >nul
echo.

echo [5] Testing MCP endpoints...
echo.
curl -s http://localhost:8000/api/mcp/status
echo.
echo.
curl -s http://localhost:8000/api/mcp/health
echo.
echo.

echo ================================================================
echo Backend restart complete!
echo ================================================================
pause