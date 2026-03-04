@echo off
title SAIDSS v2 - Backend API Server
cd /d "%~dp0"
echo.
echo =====================================================
echo   SAIDSS v2 — Smart Accident Impact Detection
echo        Safety System · Phase 1 Simulation
echo   Starting FastAPI Backend on port 8000...
echo =====================================================
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
pause
