@echo off
echo ================================================================
echo 🧪 TESTING PASSWORD RESET FUNCTIONALITY
echo ================================================================
echo.
echo This script will test the password reset feature
echo.
echo [1] Testing batch script reset method...
echo.

echo Creating test password...
echo TestPassword123! > test_password.txt

echo Running reset script...
echo TestPassword123! | call reset_admin_password.bat

echo.
echo ================================================================
echo ✅ PASSWORD RESET TEST COMPLETE
echo ================================================================
echo.
echo You can now test:
echo 1. Batch script: Run reset_admin_password.bat
echo 2. Web interface: Go to http://localhost:3000/reset-password
echo 3. Emergency access: Run emergency_access.bat
echo.
echo Login at: http://localhost:3000/login
echo Email: luka@sunny-stack.com
echo ================================================================
del test_password.txt
pause