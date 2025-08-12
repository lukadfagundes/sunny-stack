@echo off
echo ================================================================
echo 🚨 EMERGENCY ADMIN ACCESS - SUNNY PLATFORM
echo ================================================================
echo.
echo This will create a temporary admin login bypass for 1 hour
echo.
pause

echo Creating emergency access token...
cd backend
..\backend\venv\Scripts\python -c "import jwt; import time; import os; from pathlib import Path; payload = {'email': 'luka@sunny-stack.com', 'exp': time.time() + 3600}; token = jwt.encode(payload, 'emergency-key', algorithm='HS256'); env_file = Path('../.env'); lines = []; lines.append(f'EMERGENCY_TOKEN={token}'); lines.append(f'EMERGENCY_ACTIVE=true'); lines.append(f'EMERGENCY_EXPIRES={int(time.time() + 3600)}'); with open(env_file, 'a') as f: f.write('\n'.join(lines) + '\n'); print('Emergency access token created')"
cd ..

echo.
echo ================================================================
echo ✅ EMERGENCY ACCESS CREATED
echo ================================================================
echo You now have 1 hour of emergency access
echo You can login with ANY password for the next hour
echo.
echo To use:
echo 1. Go to http://localhost:3000/login
echo 2. Enter email: luka@sunny-stack.com
echo 3. Enter ANY password (it will be bypassed)
echo.
echo This access will expire in 1 hour
echo ================================================================
pause