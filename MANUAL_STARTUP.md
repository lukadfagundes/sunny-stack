# 🚀 MANUAL STARTUP INSTRUCTIONS

If the startup script keeps failing or auto-exiting, use these manual commands:

## Terminal 1 - Backend:
```bash
cd backend
python -m uvicorn app.main:asgi_app --reload --host 0.0.0.0 --port 8000
```

## Terminal 2 - Frontend:
```bash
cd frontend  
npm run dev --port 3000
```

## Terminal 3 - Tunnel:
```bash
cloudflared tunnel --config C:/Users/lukaf/.cloudflared/trinity-config.yml run trinity-dashboard
```

## Verification:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/health
- External: https://sunny-stack.com

## Notes:
- Each command should run in a separate terminal
- Services will keep running until you press Ctrl+C
- No auto-shutdown issues with manual start