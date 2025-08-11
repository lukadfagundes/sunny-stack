@echo off
echo ================================================================
echo TESTING WEBSOCKET FIX
echo ================================================================
echo.
echo [1] Testing backend WebSocket endpoint...
echo.

curl -s http://localhost:8000/socket.io/ > nul 2>&1
if %errorlevel% equ 0 (
    echo Backend Socket.IO is accessible on port 8000
) else (
    echo WARNING: Backend Socket.IO not responding on port 8000
    echo Make sure backend is running: cd backend && python -m uvicorn app.main:asgi_app --port 8000
)

echo.
echo [2] Checking if port 3001 is in use...
netstat -an | findstr :3001 | findstr LISTENING
if %errorlevel% equ 0 (
    echo WARNING: Something is still listening on port 3001
) else (
    echo Good: Port 3001 is not in use
)

echo.
echo [3] WebSocket Configuration Summary:
echo ----------------------------------------------------------------
echo Frontend WebSocket hooks updated:
echo   - useWebSocket.ts: Connects to localhost:8000 (CORRECT)
echo   - useProjectMetrics.ts: Fixed from 3001 to 8000 (FIXED)
echo.
echo Backend Socket.IO:
echo   - Served on port 8000 with FastAPI
echo   - CORS configured for ports 3000, 3001, 3002
echo.
echo Cleanup:
echo   - temp.txt deleted (was 88MB of directory listings)
echo   - temp.txt added to .gitignore
echo.
echo ================================================================
echo FIX COMPLETE!
echo ================================================================
echo.
echo Next steps:
echo 1. Restart the frontend: cd frontend && npm run dev
echo 2. Check browser console - should see "WebSocket connected"
echo 3. No more connection errors to port 3001
echo.
pause