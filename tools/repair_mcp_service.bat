@echo off
echo ================================================================
echo MCP SERVICE REPAIR UTILITY
echo ================================================================
echo.

echo [1] Installing required Python packages...
C:\Sunny\backend\venv\Scripts\pip.exe install psutil --quiet
echo     - psutil installed
echo.

echo [2] Creating required directories...
if not exist "C:\Sunny\logs" (
    mkdir "C:\Sunny\logs"
    echo     - Created logs directory
) else (
    echo     - logs directory exists
)

if not exist "C:\Sunny\projects" (
    mkdir "C:\Sunny\projects"
    echo     - Created projects directory
) else (
    echo     - projects directory exists
)

if not exist "C:\Sunny\proposals" (
    mkdir "C:\Sunny\proposals"
    echo     - Created proposals directory
) else (
    echo     - proposals directory exists
)

if not exist "C:\Sunny\database" (
    mkdir "C:\Sunny\database"
    echo     - Created database directory
) else (
    echo     - database directory exists
)
echo.

echo [3] Creating MCP configuration file...
echo {"mcp_enabled": true, "debug_mode": true, "service": "operational"} > "C:\Sunny\mcp_config.json"
echo     - MCP config created
echo.

echo [4] Testing MCP service endpoints...
echo.
echo Testing /api/mcp/status:
curl -s http://localhost:8000/api/mcp/status
echo.
echo.
echo Testing /api/mcp/health:
curl -s http://localhost:8000/api/mcp/health
echo.
echo.

echo ================================================================
echo MCP REPAIR COMPLETE
echo ================================================================
echo.
echo If endpoints still return errors, please:
echo 1. Restart the backend server (STARTUP_SUNNY.bat)
echo 2. Check the backend console for error messages
echo.
pause