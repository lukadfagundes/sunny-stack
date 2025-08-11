@echo off
echo ================================================================
echo CONNECTING TO GITHUB REPOSITORY
echo ================================================================
echo.

echo Please enter your GitHub username:
set /p GITHUB_USER=

echo.
echo Adding GitHub remote origin...
git remote add origin https://github.com/%GITHUB_USER%/sunny-ai-platform.git

if %errorlevel% neq 0 (
    echo.
    echo Remote might already exist. Trying to update it...
    git remote set-url origin https://github.com/%GITHUB_USER%/sunny-ai-platform.git
)

echo.
echo Remote configured. Current remotes:
git remote -v

echo.
echo ================================================================
echo PUSHING TO GITHUB
echo ================================================================
echo.
echo Pushing main branch to GitHub...
echo (You may be prompted for GitHub credentials)
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo SUCCESS! Code pushed to GitHub
    echo ================================================================
    echo.
    echo Your repository is now available at:
    echo https://github.com/%GITHUB_USER%/sunny-ai-platform
    echo.
    echo Total commits:
    git rev-list --count HEAD
    echo.
    echo Files tracked:
    git ls-files | find /c /v ""
    echo.
) else (
    echo.
    echo ================================================================
    echo PUSH FAILED - Troubleshooting Tips:
    echo ================================================================
    echo.
    echo 1. Make sure the repository exists on GitHub
    echo 2. Check your GitHub credentials
    echo 3. If using 2FA, you may need a Personal Access Token
    echo    - Go to GitHub Settings > Developer settings > Personal access tokens
    echo    - Generate a token with 'repo' scope
    echo    - Use the token as your password when prompted
    echo.
    echo Try running: git push -u origin main
    echo.
)

pause