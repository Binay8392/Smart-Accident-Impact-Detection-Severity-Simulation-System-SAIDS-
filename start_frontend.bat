@echo off
title SAIDS - Frontend Dev Server
cd /d "%~dp0frontend"
echo.
echo ===================================================
echo   SAIDS - Smart Accident Impact Detection System
echo   Starting React Dev Server on port 5173...
echo ===================================================
echo.
npm run dev
pause
