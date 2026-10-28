@echo off
title FarmBridge - Public Shareable Link
echo ======================================================
echo   FarmBridge Public Web Tunnel Launcher
echo   Generating an instant public HTTPS link...
echo ======================================================
echo.

:: Try running Python share_tunnel.py
python share_tunnel.py

:: If python failed or exited, fallback to direct ssh tunnel
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Running direct fallback tunnel...
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -R 80:127.0.0.1:8000 nokey@localhost.run
)

pause
1