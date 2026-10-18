@echo off
title FarmBridge - Public Shareable Link
echo ======================================================
echo   FarmBridge Public Web Tunnel
echo   Creating an instant public HTTPS link...
echo ======================================================
echo.

:: Ensure server is running
echo Checking local server on port 8000...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -UseBasicParsing -TimeoutSec 2; Write-Host 'Local server is running!' -ForegroundColor Green } catch { Write-Host 'Starting local server...' -ForegroundColor Yellow; Start-Process python -ArgumentList 'server.py' -WindowStyle Minimized; Start-Sleep -Seconds 2 }"

echo.
echo Starting secure public tunnel (keep this window open)...
echo.
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -R 80:127.0.0.1:8000 serveo.net
pause
