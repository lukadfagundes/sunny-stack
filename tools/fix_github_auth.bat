@echo off
echo ================================================================
echo FIX GITHUB AUTHENTICATION
echo ================================================================
echo.
echo Current Git configuration:
echo Username: 
git config --global user.name
echo Email: 
git config --global user.email
echo.
echo ================================================================
echo.
echo Your Git is configured for user: Luka-Fagundes
echo But the repository is under: lukadfagundes
echo.
echo OPTIONS:
echo.
echo 1. If both accounts are yours:
echo    - Go to Windows Credential Manager
echo    - Remove GitHub credentials
echo    - Try pushing again (will prompt for new credentials)
echo.
echo 2. Add Luka-Fagundes as collaborator:
echo    - Go to: https://github.com/lukadfagundes/sunny-ai-platform/settings
echo    - Click "Manage access"
echo    - Click "Add people"
echo    - Add "Luka-Fagundes"
echo.
echo 3. Change repository owner:
echo    - Transfer repository from lukadfagundes to Luka-Fagundes
echo.
echo ================================================================
echo.
echo To clear Windows credentials and try again:
echo.

set /p CLEAR="Clear GitHub credentials from Windows? (y/n): "
if /i "%CLEAR%"=="y" (
    echo Clearing GitHub credentials...
    cmdkey /delete:git:https://github.com
    echo.
    echo Credentials cleared. Now try pushing:
    git push -u origin main
    echo.
    echo You'll be prompted for:
    echo - Username: lukadfagundes
    echo - Password: Your password or Personal Access Token
)

pause