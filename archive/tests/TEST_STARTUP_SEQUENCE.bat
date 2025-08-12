@echo off
echo ========================================
echo TESTING STARTUP SEQUENCE
echo ========================================
echo.

echo Checking Python dependencies...
cd backend
call venv\Scripts\activate.bat
python -c "import uvicorn, fastapi, jwt, psutil, git; print('✓ All Python packages installed')"
if %errorlevel% neq 0 (
    echo ERROR: Missing Python packages!
    echo Run: pip install -r requirements.txt
    pause
    exit /b 1
)
cd ..

echo.
echo Checking Node.js dependencies...
cd frontend
if not exist node_modules (
    echo ERROR: Node modules not installed!
    echo Run: npm install
    pause
    exit /b 1
)
echo ✓ Node modules installed
cd ..

echo.
echo Testing backend startup command...
cd backend
call venv\Scripts\activate.bat
python -c "from app.main import app; print('✓ Backend imports successful')"
if %errorlevel% neq 0 (
    echo ERROR: Backend import failed!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo ALL TESTS PASSED!
echo ========================================
echo.
echo The startup sequence should work correctly.
echo Run STARTUP_SUNNY.bat to start the platform.
echo.
pause