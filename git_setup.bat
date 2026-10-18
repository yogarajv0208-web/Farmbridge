@echo off
setlocal enabledelayedexpansion
title FarmBridge - Git Repository Setup
echo ========================================================
echo   FarmBridge Git Repository Setup & Push
echo ========================================================
echo.

:: Check if git command exists
where git >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe" (
        set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;!PATH!"
    ) else (
        echo [ERROR] Git is not found in your PATH.
        echo Please download and install Git from: https://git-scm.com/download/win
        echo.
        pause
        exit /b 1
    )
)

echo [1/4] Checking Git repository initialization...
if not exist ".git" (
    git init
    echo Git repository initialized.
) else (
    echo Git repository already initialized.
)

echo.
echo [2/4] Staging files...
git add .

echo.
echo [3/4] Creating initial commit...
git commit -m "Initial commit: FarmBridge Tamil Nadu Farmers Marketplace prototype"
git branch -M main

echo.
echo ========================================================
echo   Git repository created successfully!
echo ========================================================
echo.
echo To link this repository to GitHub:
echo 1. Create a new repository on GitHub: https://github.com/new
echo    (Name it e.g. "farmbridge", do not initialize with README)
echo.
set /p REPO_URL="Enter your GitHub Repository URL (or press Enter to skip): "

if not "!REPO_URL!"=="" (
    git remote remove origin 2>nul
    git remote add origin !REPO_URL!
    echo.
    echo [4/4] Pushing to GitHub...
    git push -u origin main
    echo.
    echo ========================================================
    echo   Pushed to GitHub successfully!
    echo   Shareable Repository Link: !REPO_URL!
    echo ========================================================
) else (
    echo.
    echo You can push later anytime with:
    echo   git remote add origin ^<your-github-repo-url^>
    echo   git push -u origin main
)

echo.
pause
