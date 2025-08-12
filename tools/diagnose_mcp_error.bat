@echo off
echo ================================================================
echo MCP SERVICE DIAGNOSTIC
echo ================================================================
echo.
echo [1] Testing MCP endpoints and capturing errors...
echo.
echo Testing /api/mcp/status:
curl -v http://localhost:8000/api/mcp/status 2>&1
echo.
echo ----------------------------------------------------------------
echo.
echo Testing /api/mcp:
curl -v http://localhost:8000/api/mcp 2>&1
echo.
echo ----------------------------------------------------------------
echo.
echo Testing /api/mcp/logs:
curl -v http://localhost:8000/api/mcp/logs?count=5 2>&1
echo.
echo ----------------------------------------------------------------
echo.
echo Testing /api/mcp/proposals:
curl -v http://localhost:8000/api/mcp/proposals 2>&1
echo.
echo ================================================================
echo [2] Check the "Sunny Backend" console window for Python stack traces
echo.
pause