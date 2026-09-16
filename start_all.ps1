# ==============================================================================
# VINHUNI POCKET GUIDE - 1-CLICK ALL-IN-ONE LAUNCHER
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$Host.UI.RawUI.WindowTitle = "VinhUni Pocket Guide - System Launcher"
Clear-Host

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "   VINHUNI POCKET GUIDE - HE THONG QUAN TRI VA SO TAY SINH VIEN               " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = $PSScriptRoot
if (-not $PROJECT_ROOT) { $PROJECT_ROOT = (Get-Location).Path }

# ------------------------------------------------------------------------------
# 1. KHOI DONG DOCKER DATABASE CONTAINERS
# ------------------------------------------------------------------------------
Write-Host "[1/3] Dang khoi dong Docker Database Containers (PostgreSQL, Redis, Qdrant)..." -ForegroundColor Green

Set-Location $PROJECT_ROOT
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[CANH BAO] Docker compose gap loi hoac Docker Desktop chua duoc bat!" -ForegroundColor Red
} else {
    Write-Host "[OK] Docker Database (Postgres, Redis, Qdrant) da san sang va dang chay ngam!" -ForegroundColor Green
}

Write-Host ""

# ------------------------------------------------------------------------------
# 2. TU DONG MO ANDROID STUDIO
# ------------------------------------------------------------------------------
Write-Host "[2/3] Dang kiem tra va khoi dong Android Studio..." -ForegroundColor Green

$studioPaths = @(
    "C:\Program Files\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe",
    "$env:LOCALAPPDATA\Programs\Android Studio\bin\studio64.exe",
    "C:\Program Files\Android\Android Studio\bin\studio.exe"
)

$studioFound = $false
foreach ($path in $studioPaths) {
    if (Test-Path $path) {
        $studioFound = $true
        $runningStudio = Get-Process -Name "studio64", "studio" -ErrorAction SilentlyContinue
        if (-not $runningStudio) {
            Write-Host "[INFO] Dang mo Android Studio tu: $path" -ForegroundColor Cyan
            Start-Process -FilePath $path
        } else {
            Write-Host "[INFO] Android Studio da duoc mo san tren may." -ForegroundColor Yellow
        }
        break
    }
}

if (-not $studioFound) {
    Write-Host "[INFO] Khong tim thay duong dan Android Studio mac dinh. Vui long mo thu cong neu can." -ForegroundColor Yellow
}

Write-Host ""

# ------------------------------------------------------------------------------
# 3. KHOI DONG EXPO MOBILE APP
# ------------------------------------------------------------------------------
Write-Host "[3/3] Dang khoi chay ung dung di dong Expo (VinhUni-Pocket-Guide)..." -ForegroundColor Green

$mobileDir = Join-Path $PROJECT_ROOT "VinhUni-Pocket-Guide"

if (Test-Path $mobileDir) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mobileDir'; Write-Host '>>> Dang chay Expo Android...'; npx expo run:android"
    Write-Host "[OK] Da mo cua so dieu khien Expo Mobile App!" -ForegroundColor Green
} else {
    Write-Host "[LOI] Khong tim thay thu muc VinhUni-Pocket-Guide!" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# ------------------------------------------------------------------------------
# 4. IN DASHBOARD TRANG THAI
# ------------------------------------------------------------------------------
Clear-Host
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "          TOAN BO CO SO DU LIEU DOCKER DA DUOC KHOI DONG!                     " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CAC DICH VU DOCKER DATABASE DANG CHAY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  * PostgreSQL Database:         " -NoNewline; Write-Host "localhost:5432 (chatbot_db)" -ForegroundColor Cyan
Write-Host "  * Redis Cache:                 " -NoNewline; Write-Host "localhost:6379" -ForegroundColor Cyan
Write-Host "  * Qdrant Vector DB:            " -NoNewline; Write-Host "http://localhost:6333/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "HUONG DAN CHAY LOCAL DEV (HOST MACHINE):" -ForegroundColor Yellow
Write-Host "  * Backend (Port 8000):         cd backend; uvicorn api.main:app --reload" -ForegroundColor White
Write-Host "  * API Chatbot (Port 8001):     cd api-chatbot; uvicorn api.main:app --port 8001 --reload" -ForegroundColor White
Write-Host "  * Frontend Admin (Port 5173):  cd frontend; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Goi y lenh huu ich:" -ForegroundColor Yellow
Write-Host "   - Dung Database Docker:     docker compose down" -ForegroundColor White
Write-Host "   - Xem container dang chay:  docker compose ps" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
