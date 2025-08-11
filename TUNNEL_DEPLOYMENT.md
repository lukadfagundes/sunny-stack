# 🚀 Sunny AI Platform - Cloudflare Tunnel Deployment

## Overview
This guide covers deploying Sunny AI Platform to production via Cloudflare Tunnel, making it accessible at https://sunny-stack.com

## Quick Start

### One-Click Production Deployment
```batch
START_SUNNY_PRODUCTION.bat
```
This will:
1. Start backend (port 8000)
2. Start frontend (port 3001)
3. Configure and start Cloudflare tunnel
4. Deploy to https://sunny-stack.com

## Architecture

```
Internet → Cloudflare → Tunnel → Local Services
         ↓
   sunny-stack.com
         ↓
   [Cloudflare Tunnel]
         ↓
    Local Machine
    ├── Backend (8000)
    └── Frontend (3001)
```

## Prerequisites

### 1. Cloudflare Account Setup
- Domain `sunny-stack.com` added to Cloudflare
- DNS managed by Cloudflare
- Tunnel already created (ID: `bbe0403e-ca90-4dbd-b9cb-f9e08d66754b`)

### 2. Local Requirements
- Node.js 16+ installed
- Python 3.8+ with virtual environment
- Cloudflared CLI installed
- Ports 8000 and 3001 available

### 3. Tunnel Credentials
The tunnel credentials file must exist at:
```
C:\Users\lukaf\.cloudflared\bbe0403e-ca90-4dbd-b9cb-f9e08d66754b.json
```

If missing, run:
```batch
cloudflared tunnel login
```

## Deployment Scripts

### Main Deployment
| Script | Purpose |
|--------|---------|
| `START_SUNNY_PRODUCTION.bat` | Complete startup (services + tunnel) |
| `deploy_sunny_production.bat` | Deploy tunnel configuration only |
| `restart_tunnel.bat` | Restart tunnel without touching services |
| `stop_tunnel.bat` | Stop tunnel (site goes offline) |

### Monitoring & Verification
| Script | Purpose |
|--------|---------|
| `check_status.bat` | Quick status check of all components |
| `verify_deployment.bat` | Comprehensive deployment verification |
| `troubleshoot_tunnel.bat` | Diagnose and fix common issues |

## Configuration

### Tunnel Configuration (`cloudflare-tunnel/config.yml`)

The tunnel routes requests as follows:

| URL Pattern | Service | Port |
|-------------|---------|------|
| `/api/*` | Backend API | 8000 |
| `/api/mcp/*` | MCP Endpoints | 8000 |
| `/ws/*` | WebSocket | 8000 |
| `/health` | Health Check | 8000 |
| `/docs` | API Documentation | 8000 |
| `/` (root) | Frontend | 3001 |

### Subdomains

| Subdomain | Purpose | Service |
|-----------|---------|---------|
| `sunny-stack.com` | Main platform | Frontend (3001) |
| `api.sunny-stack.com` | API access | Backend (8000) |
| `mcp.sunny-stack.com` | MCP endpoints | Backend (8000) |
| `navigators-core.sunny-stack.com` | Client project | Frontend (3001) |

## Production URLs

Once deployed, access Sunny at:

- **Main Site**: https://sunny-stack.com
- **API Health**: https://sunny-stack.com/api/health
- **MCP Status**: https://sunny-stack.com/api/mcp/status
- **API Docs**: https://sunny-stack.com/docs
- **Admin Panel**: https://sunny-stack.com/admin

## Claude MCP Integration

After deployment, configure Claude to connect:

1. In Claude.ai, add MCP connector:
   - **Name**: `Sunny Development Monitor`
   - **URL**: `https://sunny-stack.com/api/mcp`
   - **Auth**: None (handled by platform)

2. Available MCP endpoints:
   - `/api/mcp/status` - System status
   - `/api/mcp/logs` - Debug logs
   - `/api/mcp/proposals` - Self-improvement proposals
   - `/api/mcp/project/structure` - Project info

## Authentication

### Master Admin Access
- **Email**: `luka@sunny-stack.com`
- **Password**: `SunnyMaster2024!`
- **Role**: `master_admin`
- **Access**: Full platform control

### Creating Temporary Users
Use the admin panel or API to create temporary access for:
- Client demos
- Testing
- Limited access users

## Troubleshooting

### Common Issues

#### Tunnel Won't Start
```batch
troubleshoot_tunnel.bat
```
This will check:
- Cloudflared installation
- Credentials file
- Configuration
- Service status

#### Backend Not Accessible
1. Check if running: `netstat -an | findstr :8000`
2. Restart backend: 
   ```batch
   cd backend
   venv\Scripts\python -m uvicorn app.main:asgi_app --reload --port 8000
   ```

#### Frontend Not Loading
1. Check if running: `netstat -an | findstr :3001`
2. Restart frontend:
   ```batch
   cd frontend
   npm run dev
   ```

#### 502 Bad Gateway
- Ensure local services are running
- Check tunnel configuration
- Verify ports match config

### Viewing Logs

#### Tunnel Logs
```batch
type C:\Sunny\cloudflare-tunnel\tunnel.log
```

#### Live Tunnel Monitoring
```batch
cloudflared tunnel info bbe0403e-ca90-4dbd-b9cb-f9e08d66754b
```

#### Service Logs
- Backend logs: Check backend terminal window
- Frontend logs: Check frontend terminal window

## Security Notes

1. **Tunnel Security**
   - Traffic encrypted end-to-end via Cloudflare
   - No port forwarding required
   - DDoS protection included

2. **Local Security**
   - Services only accessible via tunnel
   - Authentication required for admin routes
   - JWT tokens for API access

3. **Production Best Practices**
   - Regular credential rotation
   - Monitor access logs
   - Keep dependencies updated

## Maintenance

### Updating Sunny
1. Stop tunnel: `stop_tunnel.bat`
2. Update code
3. Restart: `START_SUNNY_PRODUCTION.bat`

### Updating Tunnel Configuration
1. Edit `cloudflare-tunnel/config.yml`
2. Run `restart_tunnel.bat`

### Backup Configuration
Configuration automatically backed up when deploying:
```
C:\Users\lukaf\.cloudflared\config.yml.backup_[timestamp]
```

## Performance Optimization

### Tunnel Settings
- HTTP/2 enabled for better performance
- Keep-alive connections: 100
- Connect timeout: 30s

### Monitoring Performance
```batch
curl -w "@curl-format.txt" -o /dev/null -s https://sunny-stack.com
```

## Advanced Usage

### Running Tunnel as Windows Service
```batch
cloudflared service install --config C:\Users\lukaf\.cloudflared\config.yml
cloudflared service start
```

### Multiple Tunnels
Create additional tunnels for staging/development:
```batch
cloudflared tunnel create sunny-staging
cloudflared tunnel route dns sunny-staging staging.sunny-stack.com
```

## Support

### Getting Help
- Check status: `check_status.bat`
- Verify deployment: `verify_deployment.bat`
- Troubleshoot: `troubleshoot_tunnel.bat`

### Contact
- **Platform Owner**: luka@sunny-stack.com
- **Documentation**: This file
- **Cloudflare Dashboard**: https://dash.cloudflare.com

## Success Indicators

After successful deployment:
- ✅ All status checks pass in `verify_deployment.bat`
- ✅ Site accessible at https://sunny-stack.com
- ✅ API returns healthy status
- ✅ MCP endpoints respond
- ✅ Authentication works
- ✅ Claude can connect via MCP

---

## Quick Command Reference

```batch
# Start everything
START_SUNNY_PRODUCTION.bat

# Check status
check_status.bat

# Stop tunnel
stop_tunnel.bat

# Restart tunnel
restart_tunnel.bat

# Full verification
verify_deployment.bat

# Troubleshoot issues
troubleshoot_tunnel.bat
```

---

**🌟 Sunny AI Platform - Ready for Production!**

The world's first self-improving AI consulting platform is now live at sunny-stack.com!