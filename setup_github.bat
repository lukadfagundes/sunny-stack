@echo off
echo ================================================================
echo SETTING UP SUNNY GITHUB REPOSITORY
echo ================================================================
echo.

echo [1/6] Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo Git initialization failed. Please ensure Git is installed.
    echo You can download Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo Git repository initialized
echo.

echo [2/6] Adding all files to staging...
git add .
echo Files staged for commit
echo.

echo [3/6] Creating initial commit...
git commit -m "Initial commit: Sunny AI Platform

- Live production platform at sunny-stack.com
- FastAPI backend with MCP integration  
- Next.js frontend with Trinity interface
- Cloudflare Tunnel deployment
- Real-time AI collaboration ready
- Professional consulting platform operational

Features:
- MCP (Model Context Protocol) for real-time AI monitoring
- JWT authentication with role-based access control
- Project management and proposal generation
- Client analytics and metrics tracking
- Self-improvement capabilities
- WebSocket support for real-time updates

Infrastructure:
- Secure deployment via Cloudflare Tunnel
- No exposed ports to internet
- Auto-scaling capabilities
- Comprehensive logging and monitoring"

if %errorlevel% neq 0 (
    echo Initial commit failed
    pause
    exit /b 1
)
echo Initial commit created
echo.

echo [4/6] Setting up main branch...
git branch -M main
echo Main branch configured
echo.

echo [5/6] Ready to add remote repository...
echo.
echo ================================================================
echo NEXT STEPS TO COMPLETE GITHUB SETUP:
echo ================================================================
echo.
echo 1. Go to GitHub.com and create a new repository:
echo    - Repository name: sunny-ai-platform
echo    - Description: Revolutionary AI-powered consulting platform
echo    - Set as Private or Public as desired
echo    - DO NOT initialize with README, .gitignore, or license
echo.
echo 2. After creating the repository, copy the repository URL
echo    Example: https://github.com/[username]/sunny-ai-platform.git
echo.
echo 3. Run these commands to connect and push:
echo.
echo    git remote add origin [PASTE_YOUR_REPOSITORY_URL_HERE]
echo    git push -u origin main
echo.
echo ================================================================
echo.
echo [6/6] Local repository setup complete!
echo Ready for GitHub connection
echo.
echo ================================================================
echo SUNNY IS READY FOR VERSION CONTROL!
echo ================================================================
echo.
echo Current repository status:
git status --short
echo.
echo Total files tracked:
git ls-files | find /c /v ""
echo.
echo Repository size:
for /f "tokens=1" %%a in ('git count-objects -v ^| findstr size-pack') do echo %%a
echo.
pause