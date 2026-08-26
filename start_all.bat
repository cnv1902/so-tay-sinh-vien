@echo off
chcp 65001 > nul
title VinhUni Pocket Guide - System Starter

echo ==============================================================================
echo    VINHUNI POCKET GUIDE - KHOI DONG HE THONG
echo ==============================================================================
echo.

REM 1. Khoi dong Docker Compose
echo [1/3] Dang khoi dong Docker Containers...
cd /d "%~dp0"
docker compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker compose gap loi hoac Docker Desktop chua duoc bat!
    echo Vui long kiem tra Docker Desktop va thu lai.
    pause
    exit /b %ERRORLEVEL%
)

echo [OK] Docker Containers da san sang va dang chay ngam!
echo.

REM 2. Mo trinh duyet Microsoft Edge vao trang Admin Frontend
echo [2/3] Dang mo Web Admin tren Microsoft Edge: http://localhost:5173
start msedge http://localhost:5173 2>nul || start http://localhost:5173
echo.

REM 3. Chay Android Mobile App
echo [3/3] Dang khoi dong VinhUni-Pocket-Guide: npx expo run:android
cd /d "%~dp0VinhUni-Pocket-Guide"
call npx expo run:android

pause
