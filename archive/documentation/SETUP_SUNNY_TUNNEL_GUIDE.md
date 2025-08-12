# 🚀 SUNNY TUNNEL SETUP GUIDE

## Quick Setup Instructions

### Step 1: Create the New Tunnel
```batch
cd C:\Sunny
create_sunny_tunnel.bat
```
**Note the tunnel ID that appears!** You'll need it for the next steps.

### Step 2: Update Configuration
Edit `C:\Users\lukaf\.cloudflared\sunny-config.yml`:
- Replace `[NEW_TUNNEL_ID]` with your actual tunnel ID (both occurrences)

### Step 3: Setup DNS Routing
```batch
setup_dns_routing.bat
```
Enter your tunnel ID when prompted.

### Step 4: Update DNS Records in Cloudflare Dashboard
Since your domain is in the old business account, manually update these CNAME records:

| Record | From (Old) | To (New) |
|--------|------------|----------|
| sunny-stack.com | bbe0403e-ca90-4dbd-b9cb-f9e08d66754b.cfargotunnel.com | [YOUR_NEW_TUNNEL_ID].cfargotunnel.com |
| api | bbe0403e-ca90-4dbd-b9cb-f9e08d66754b.cfargotunnel.com | [YOUR_NEW_TUNNEL_ID].cfargotunnel.com |
| navigators-core | bbe0403e-ca90-4dbd-b9cb-f9e08d66754b.cfargotunnel.com | [YOUR_NEW_TUNNEL_ID].cfargotunnel.com |

### Step 5: Start Everything
```batch
STARTUP_SUNNY.bat
```

### Step 6: Verify
```batch
verify_sunny_tunnel.bat
```

## Troubleshooting Commands

### Debug the tunnel:
```batch
debug_sunny_tunnel.bat
```

### Start tunnel with debug logging:
```batch
start_sunny_tunnel_debug.bat
```

## File Locations
- **Tunnel Config**: `C:\Users\lukaf\.cloudflared\sunny-config.yml`
- **Tunnel Logs**: `C:\Sunny\logs\tunnel.log`
- **Scripts**: `C:\Sunny\*.bat`

## Common Issues & Solutions

### Error 1033: Cloudflare Tunnel error
- **Cause**: DNS pointing to wrong/unconfigured tunnel
- **Fix**: Update DNS records to new tunnel ID

### Backend/Frontend not responding
- **Cause**: Services not started
- **Fix**: Run `STARTUP_SUNNY.bat`

### Tunnel not connecting
- **Cause**: Configuration file issues
- **Fix**: Check tunnel ID in config matches actual tunnel

## Success Criteria
All tests in `verify_sunny_tunnel.bat` should pass:
- ✅ Local services running (backend:8000, frontend:3001)
- ✅ Cloudflared tunnel process active
- ✅ Production endpoints accessible via HTTPS
- ✅ MCP endpoints ready for Claude
- ✅ DNS correctly configured

## Production URLs
- **Main Site**: https://sunny-stack.com
- **API**: https://api.sunny-stack.com
- **NavigatorCore**: https://navigators-core.sunny-stack.com
- **Health Check**: https://sunny-stack.com/health
- **MCP Status**: https://sunny-stack.com/api/mcp/status