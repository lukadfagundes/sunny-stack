@echo off
echo ================================================================
echo 🔑 SUNNY ADMIN PASSWORD RESET
echo ================================================================
echo.

echo [1/3] Stopping Sunny services...
call STOP_SUNNY.bat

echo.
echo [2/3] Resetting admin credentials...
echo.

set /p NEW_PASSWORD="Enter new admin password: "
echo.

echo Generating secure hash...
cd backend
..\backend\venv\Scripts\python -c "import bcrypt; import sys; password = sys.argv[1].encode('utf-8'); hash = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8'); print(f'ADMIN_PASSWORD_HASH={hash}')" "%NEW_PASSWORD%" > ..\.env.temp
cd ..

echo Updating environment...
findstr /v "ADMIN_PASSWORD_HASH" .env > .env.new 2>nul
if exist .env.new (
    type .env.temp >> .env.new
    move /y .env.new .env >nul
) else (
    type .env.temp > .env
)
del .env.temp

echo.
echo [3/3] Restarting Sunny with new credentials...
call STARTUP_SUNNY.bat

echo.
echo ================================================================
echo ✅ ADMIN PASSWORD RESET COMPLETE
echo ================================================================
echo Login URL: http://localhost:3000/login
echo Email: luka@sunny-stack.com
echo Password: [Your new password]
echo ================================================================
pause