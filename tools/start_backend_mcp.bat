@echo off
echo 🚀 Starting Sunny MCP Server...
cd /d "C:\Sunny\backend"

REM Activate virtual environment
call venv\Scripts\activate

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir "logs"

REM Start MCP server with comprehensive logging
echo 🔧 Starting MCP server with debugging...
echo MCP Server started at %date% %time% > logs\mcp_startup.log
python mcp_server.py 2>&1
echo.
echo MCP Server stopped at %date% %time% >> logs\mcp_startup.log