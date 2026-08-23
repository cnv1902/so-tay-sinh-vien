# ==============================================================================
# SỔ TAY SINH VIÊN ĐẠI HỌC VINH - 1-CLICK ALL-IN-ONE LAUNCHER
# Khởi động: Docker Services + Android Studio / Emulator + Expo App + Dashboard CLI
# ==============================================================================

$Host.UI.RawUI.WindowTitle = "VinhUni Pocket Guide - System Launcher"
Clear-Host

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "   🎓 VINHUNI POCKET GUIDE - HỆ THỐNG QUẢN TRỊ & SỔ TAY SINH VIÊN            " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = $PSScriptRoot
if (-not $PROJECT_ROOT) { $PROJECT_ROOT = (Get-Location).Path }

# ------------------------------------------------------------------------------
# 1. KHỞI ĐỘNG DOCKER COMPOSE TOÀN BỘ SERVICES
# ------------------------------------------------------------------------------
Write-Host "[1/3] Đang khởi động toàn bộ Docker Containers (DB, Redis, Qdrant, Backend, Chatbot, Frontend)..." -ForegroundColor Green

Set-Location $PROJECT_ROOT
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Cảnh báo: Docker compose gặp lỗi hoặc Docker Desktop chưa được mở!" -ForegroundColor Red
} else {
    Write-Host "✅ Docker Containers đã sẵn sàng và đang chạy ngầm!" -ForegroundColor Green
}

Write-Host ""

# ------------------------------------------------------------------------------
# 2. TỰ ĐỘNG MỞ ANDROID STUDIO / EMULATOR
# ------------------------------------------------------------------------------
Write-Host "[2/3] Đang kiểm tra và khởi động Android Studio / Giả lập..." -ForegroundColor Green

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
        # Kiểm tra xem Android Studio đã mở chưa
        $runningStudio = Get-Process -Name "studio64", "studio" -ErrorAction SilentlyContinue
        if (-not $runningStudio) {
            Write-Host "🚀 Đang mở Android Studio từ: $path" -ForegroundColor Cyan
            Start-Process -FilePath $path
        } else {
            Write-Host "ℹ️  Android Studio đã đang mở sẵn trên máy." -ForegroundColor Yellow
        }
        break
    }
}

if (-not $studioFound) {
    Write-Host "⚠️  Không tìm thấy đường dẫn Android Studio mặc định. Vui lòng mở thủ công nếu cần." -ForegroundColor Yellow
}

Write-Host ""

# ------------------------------------------------------------------------------
# 3. KHỞI ĐỘNG EXPO MOBILE APP (MỞ CỬA SỔ TERMINAL RIÊNG)
# ------------------------------------------------------------------------------
Write-Host "[3/3] Đang khởi chạy ứng dụng di động Expo (VinhUni-Pocket-Guide)..." -ForegroundColor Green

$mobileDir = Join-Path $PROJECT_ROOT "VinhUni-Pocket-Guide"

if (Test-Path $mobileDir) {
    # Mở terminal powershell mới để chạy expo
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mobileDir'; Write-Host '🚀 Đang chạy Expo Android...'; npx expo run:android"
    Write-Host "✅ Đã mở cửa sổ điều khiển Expo Mobile App!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Không tìm thấy thư mục VinhUni-Pocket-Guide!" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# ------------------------------------------------------------------------------
# 4. IN DASHBOARD TRẠNG THÁI & ĐƯỜNG DẪN TRUY CẬP
# ------------------------------------------------------------------------------
Clear-Host
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "          🎉 TOÀN BỘ HỆ THỐNG ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!                  " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 ĐƯỜNG DẪN TRUY CẬP CÁC DỊCH VỤ:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🖥️  Giao diện Web Admin:         " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "  🚀  Backend Core API Docs:       " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  🤖  AI Chatbot & RAG API Docs:   " -NoNewline; Write-Host "http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host "  🗄️  Qdrant Vector DB Dashboard:  " -NoNewline; Write-Host "http://localhost:6333/dashboard" -ForegroundColor Cyan
Write-Host "  📱  Ứng dụng Di động Expo:       " -NoNewline; Write-Host "Đang build & chạy trên Android Emulator" -ForegroundColor Green
Write-Host ""
Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "💡 Gợi ý lệnh hữu ích:" -ForegroundColor Yellow
Write-Host "   - Dừng toàn bộ hệ thống:    docker compose down" -ForegroundColor White
Write-Host "   - Xem logs Backend:         docker compose logs -f backend" -ForegroundColor White
Write-Host "   - Xem logs AI Chatbot:      docker compose logs -f api-chatbot" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
