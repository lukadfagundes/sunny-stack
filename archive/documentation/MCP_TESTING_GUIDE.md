# 🔧 MCP API Testing Guide for Sunny Platform

## 📊 Current MCP Implementation Status

Your Sunny platform already has a working MCP implementation using JSON-RPC protocol at `/api/mcp`. The system is configured and includes:

### Existing MCP Endpoints:
- **JSON-RPC Handler**: `/api/mcp` (main endpoint for Claude.ai)
- **Status Endpoint**: `/api/mcp/status`
- **Info Endpoint**: `/api/mcp/info`

### Files Already In Place:
- `backend/app/routes/mcp_simple.py` - Simplified JSON-RPC handler
- `backend/app/routes/mcp_protocol.py` - Full protocol implementation
- `backend/app/services/mcp_tools.py` - MCP tools implementation
- `backend/app/services/mcp_file_operations.py` - File operations service

---

## 🚀 How to Start Your Backend

### Option 1: Use the Startup Script (Recommended)
```batch
# Run from C:\Sunny directory
STARTUP_SUNNY.bat
```
This will start:
1. Cloudflare tunnel
2. Backend server (port 8000)
3. Frontend server (port 3000)

### Option 2: Start Backend Only
```batch
# Run from C:\Sunny directory
start_backend_mcp.bat
```

### Option 3: Manual Start
```batch
cd C:\Sunny\backend
venv\Scripts\python.exe -m uvicorn app.main:asgi_app --reload --port 8000 --host 0.0.0.0
```

---

## 🧪 Testing MCP Endpoints

### 1. Test Local Endpoints
```bash
# Check if backend is running
curl http://localhost:8000/health

# Test MCP status
curl http://localhost:8000/api/mcp/status

# Test MCP info
curl http://localhost:8000/api/mcp/info

# Test MCP debug endpoints
curl http://localhost:8000/api/debug/mcp-status
curl http://localhost:8000/api/debug/mcp-tools
```

### 2. Test JSON-RPC Protocol
```bash
# Initialize handshake
curl -X POST http://localhost:8000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# List available tools
curl -X POST http://localhost:8000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool (example: read_file)
curl -X POST http://localhost:8000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"read_file","arguments":{"path":"CLAUDE.md"}}}'
```

### 3. Test Through Cloudflare Tunnel
Once your backend is running and tunnel is active:
```bash
# Test public endpoint
curl https://sunny-stack.com/api/mcp/status

# Test JSON-RPC through tunnel
curl -X POST https://sunny-stack.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

---

## 🔌 Claude.ai MCP Connector Configuration

### Setting Up Claude.ai Connector:

1. **In Claude.ai, go to Settings → MCP Connectors**
2. **Add New Connector:**
   - **Name**: Sunny Platform
   - **URL**: `https://sunny-stack.com/api/mcp`
   - **Advanced Settings**: Leave empty (no authentication required)

3. **Test Connection:**
   - Click "Test Connection"
   - You should see "Connected" status
   - Available tools will be listed

### Available MCP Tools:
- `read_file` - Read project files
- `write_file` - Write/modify files
- `create_file` - Create new files
- `delete_file` - Delete files
- `list_directory` - List directory contents
- `search_files` - Search text in files
- `get_project_tree` - Get project structure
- `git_status` - Get git repository status
- `run_command` - Execute shell commands

---

## 🐛 Troubleshooting

### Backend Not Starting:
1. Check Python installation: `python --version`
2. Check virtual environment: `backend\venv\Scripts\python.exe --version`
3. Check for port conflicts: `netstat -an | findstr :8000`
4. Review logs in `C:\Sunny\logs\`

### MCP Connection Issues:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS configuration in `backend/app/main.py`
3. Ensure Cloudflare tunnel is active
4. Test with simplified curl commands first

### Cloudflare Error 530:
- This means the tunnel is not connected to your local backend
- Run `STARTUP_SUNNY.bat` to start all services
- Check tunnel status: `cloudflared tunnel list`

---

## 📝 Current Configuration Notes

### CORS Settings:
Your backend is configured to allow:
- `https://claude.ai`
- `https://*.claude.ai`
- `https://sunny-stack.com`
- `localhost` origins for development

### Authentication:
- Currently DISABLED for MCP endpoints to allow Claude.ai access
- Emergency access logging is active
- Can be re-enabled after testing

### MCP Protocol Version:
- Using: `2024-11-05`
- Protocol: JSON-RPC 2.0
- Server: Sunny AI Platform MCP v1.0.0

---

## ✅ Quick Verification Checklist

1. [ ] Backend starts without errors
2. [ ] `http://localhost:8000/health` returns healthy status
3. [ ] `http://localhost:8000/api/mcp/status` returns operational
4. [ ] JSON-RPC initialize method works
5. [ ] tools/list returns available tools
6. [ ] Cloudflare tunnel is connected
7. [ ] `https://sunny-stack.com/api/mcp/status` is accessible
8. [ ] Claude.ai connector shows "Connected"

---

## 🎯 Next Steps

Once everything is working:
1. Test file operations through Claude.ai
2. Monitor debug logs at `/api/debug/mcp-status`
3. Check emergency access logs at `/emergency/access-logs`
4. Re-enable authentication when ready for production

Your MCP implementation is ready - you just need to start the backend server!