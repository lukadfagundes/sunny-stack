# 🚀 Sunny AI Platform Deployment Guide

## Production Deployment (sunny-stack.com)

### Overview
Deploy the Sunny AI Platform to production using Cloudflare Tunnel for secure, zero-trust networking.

### Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed
- Cloudflare account with tunnel access
- Domain configured in Cloudflare DNS (sunny-stack.com)
- Production environment variables configured

### Quick Deployment

#### Windows:
```cmd
.\STARTUP_SUNNY.bat
```

This script will:
1. Start Cloudflare Tunnel (MUST be first)
2. Wait for tunnel connection
3. Start Backend API (port 8000)
4. Wait for backend health check
5. Start Frontend (port 3000)
6. Verify all services are running

**⚠️ CRITICAL SERVICE ORDER:**
- Tunnel MUST start before any services
- Backend MUST be ready before frontend
- This prevents 530 errors and ensures proper initialization

### Manual Deployment Steps

1. **Start Cloudflare Tunnel (FIRST)**
```bash
cloudflared tunnel --config C:\Users\lukaf\.cloudflared\sunny-config.yml run
```
Wait for "Tunnel is ready" message

2. **Start Backend Service (SECOND)**
```bash
cd backend
venv\Scripts\activate  # Windows
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Wait for "Application startup complete"

3. **Start Frontend Service (LAST)**
```bash
cd frontend
npm run dev -- --port 3000
```

4. **Verify Deployment**
```bash
.\verify_deployment.bat
```

### Post-Deployment Verification

```bash
# Check tunnel status
curl https://sunny-stack.com/health

# Verify MCP connection
curl https://sunny-stack.com/api/mcp/status

# Test authentication
curl -X POST https://sunny-stack.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sunny-stack.com","password":"password"}'
```

### Platform Endpoints

Once deployed, the following endpoints will be available:

| Endpoint | Description |
|----------|-------------|
| https://sunny-stack.com/ | Main platform interface |
| https://sunny-stack.com/health | Health check endpoint |
| https://sunny-stack.com/api/auth/login | Authentication endpoint |
| https://sunny-stack.com/api/mcp/status | MCP connector status |
| https://sunny-stack.com/api/mcp/logs | Debug logs for Claude |
| https://sunny-stack.com/api/mcp/proposals | Self-improvement proposals |
| https://sunny-stack.com/api/mcp/project/structure | Project structure info |

### MCP (Model Context Protocol) Integration

The platform includes real-time MCP integration for AI collaboration:

1. **MCP Endpoints:**
   - Status: `https://sunny-stack.com/api/mcp/status`
   - Health: `https://sunny-stack.com/api/mcp/health`
   - Logs: `https://sunny-stack.com/api/mcp/logs`
   - Project Structure: `https://sunny-stack.com/api/mcp/project/structure`
   - Error Analysis: `https://sunny-stack.com/api/mcp/errors/analysis`

2. **MCP Capabilities:**
   - Real-time system monitoring
   - Debug log access (last 1000 entries)
   - Project file reading
   - Error pattern analysis
   - Performance metrics tracking
   - Live collaboration with AI partners

### Security Configuration

1. **Master Admin Access:**
   - Email: `luka@sunny-stack.com`
   - Password: Set via `MASTER_PASSWORD` secret

2. **JWT Configuration:**
   - Generate a secure 256-bit secret
   - Use for token signing
   - 8-hour token expiration for admins
   - 4-hour token expiration for temporary users

3. **CORS Configuration:**
   - Allowed origins: sunny-stack.com, claude.ai, api.anthropic.com
   - Credentials enabled for secure authentication

### Monitoring & Debugging

1. **View Live Logs:**
```bash
wrangler tail --env production
```

2. **Check Deployment Status:**
```bash
curl https://sunny-stack.com/health
```

3. **Test Authentication:**
```bash
curl -X POST https://sunny-stack.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luka@sunny-stack.com","password":"YOUR_MASTER_PASSWORD"}'
```

4. **Check MCP Status:**
```bash
curl https://sunny-stack.com/api/mcp/status
```

### Environment Configuration

1. **Backend (.env file):**
```env
# Authentication
JWT_SECRET=your-secure-256-bit-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database
DATABASE_URL=sqlite:///./sunny.db

# Environment
ENVIRONMENT=production
DEBUG=false
```

2. **Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://sunny-stack.com
NEXT_PUBLIC_WS_URL=wss://sunny-stack.com
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| 530 Error | Ensure services start in correct order: Tunnel → Backend → Frontend |
| MCP 500 Error | Check authentication middleware, ensure psutil is installed |
| Tunnel not connecting | Verify cloudflared config and credentials |
| Backend not starting | Check Python venv activation and dependencies |
| Frontend build errors | Clear .next folder and node_modules, reinstall |
| Authentication fails | Verify JWT_SECRET is set in .env file |
| CORS errors | Check allowed origins in backend CORS middleware |

### Management Scripts

#### Core Operations
- `STARTUP_SUNNY.bat` - Start all services in correct order
- `STOP_SUNNY.bat` - Gracefully stop all services
- `RESTART_SUNNY.bat` - Restart backend service

#### Diagnostics & Repair
- `enhanced_debug.bat` - Comprehensive system diagnostics
- `diagnose_mcp_error.bat` - Debug MCP service issues
- `repair_mcp_service.bat` - Auto-fix common MCP problems
- `check_status.bat` - Quick health check

#### Testing
- `test_mcp_authenticated.bat` - Test MCP with authentication
- `verify_deployment.bat` - Full deployment verification

### Development Deployment

For local development without tunnel:

```bash
# Backend only
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend only
cd frontend
npm run dev

# Access locally
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

### Support & Contact

- **Platform Owner:** luka@sunny-stack.com
- **Documentation:** https://sunny-stack.com/docs
- **MCP Endpoint:** https://sunny-stack.com/api/mcp
- **Version:** 2.0-sentient

### Success Criteria

After successful deployment, verify:
- ✅ Platform accessible at https://sunny-stack.com
- ✅ Cloudflare Tunnel connected and routing traffic
- ✅ Backend health endpoint returns "healthy" status
- ✅ Frontend loads Trinity interface
- ✅ MCP endpoints respond with system metrics
- ✅ Authentication protects sensitive routes
- ✅ WebSocket connections for real-time updates
- ✅ All services start in correct order (Tunnel → Backend → Frontend)

### Security Best Practices

1. **Never commit secrets** - Use .env files (excluded from git)
2. **Rotate JWT secrets** - Change regularly for security
3. **Monitor access logs** - Check for unauthorized attempts
4. **Update dependencies** - Keep packages current
5. **Use HTTPS only** - Cloudflare Tunnel ensures encryption

---

**🌟 Sunny AI Platform - Where Human Expertise Meets AI Intelligence**

Successfully deployed and serving the future of consulting at sunny-stack.com!