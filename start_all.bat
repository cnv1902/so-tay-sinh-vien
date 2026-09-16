@echo off
chcp 65001 > nul
title VinhUni Pocket Guide - System Starter

echo ==============================================================================
echo    VINHUNI POCKET GUIDE - KHOI DONG DOCKER DATABASES
echo ==============================================================================
echo.

REM 1. Khoi dong Docker Database Containers (Postgres, Redis, Qdrant)
echo [1/2] Dang khoi dong Docker Database Containers...
cd /d "%~dp0"
docker compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker compose gap loi hoac Docker Desktop chua duoc bat!
    echo Vui long kiem tra Docker Desktop va thu lai.
    pause
    exit /b %ERRORLEVEL%
)

echo [OK] Docker Database (Postgres, Redis, Qdrant) da san sang va dang chay ngam!
echo.

REM 2. Chay Android Mobile App
echo [2/2] Dang khoi dong VinhUni-Pocket-Guide: npx expo run:android
cd /d "%~dp0VinhUni-Pocket-Guide"
call npx expo run:android

pause
