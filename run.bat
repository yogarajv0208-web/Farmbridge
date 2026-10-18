@echo off
title FarmBridge - Tamil Nadu Farmers Marketplace
echo ======================================================
echo   Starting FarmBridge Prototype Server...
echo   Opening website at http://localhost:8000
echo ======================================================

:: Launch default web browser automatically
start "" "http://localhost:8000"

:: Start the Python backend server
python server.py

pause
