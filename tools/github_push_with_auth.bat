@echo off
echo ================================================================
echo GITHUB PUSH WITH AUTHENTICATION
echo ================================================================
echo.
echo This script will help you push to GitHub with proper authentication.
echo.
echo If you have 2FA enabled, you'll need a Personal Access Token:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Click "Generate new token (classic)"
echo 3. Give it a name like "sunny-platform"
echo 4. Select the "repo" scope
echo 5. Generate and copy the token
echo 6. Use the token as your password below
echo.
echo ================================================================
echo.

echo Current repository URL:
git remote -v
echo.

echo Attempting to push to GitHub...
echo You will be prompted for credentials:
echo - Username: lukadfagundes
echo - Password: Your GitHub password OR Personal Access Token
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo SUCCESS! Code pushed to GitHub
    echo ================================================================
    echo.
    echo Your repository is now available at:
    echo https://github.com/lukadfagundes/sunny-ai-platform
    echo.
) else (
    echo.
    echo ================================================================
    echo TROUBLESHOOTING
    echo ================================================================
    echo.
    echo If push failed, try:
    echo.
    echo 1. Verify repository exists at:
    echo    https://github.com/lukadfagundes?tab=repositories
    echo.
    echo 2. Check if repository is named exactly: sunny-ai-platform
    echo.
    echo 3. If using 2FA, create a Personal Access Token:
    echo    https://github.com/settings/tokens
    echo.
    echo 4. Try cloning with HTTPS to test access:
    echo    git clone https://github.com/lukadfagundes/sunny-ai-platform test-clone
    echo.
    echo 5. Alternative: Use GitHub Desktop or git GUI
    echo.
)

pause