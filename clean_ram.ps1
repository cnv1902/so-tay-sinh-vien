# ==============================================================================
# RAM CLEANER & OPTIMIZER - VINHUNI POCKET GUIDE
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$Host.UI.RawUI.WindowTitle = "RAM Cleaner - VinhUni Pocket Guide Optimizer"
Clear-Host

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "             CONG CU GIAI PHONG BO NHO RAM - VINHUNI GUIDE                    " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Tinh toan RAM truoc khi don dep
$os = Get-CimInstance Win32_OperatingSystem
$totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeRAMBefore = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$usedRAMBefore = [math]::Round($totalRAM - $freeRAMBefore, 2)

Write-Host "[*] Thong so RAM hien tai: Dung $usedRAMBefore GB / Tong $totalRAM GB (Trong: $freeRAMBefore GB)" -ForegroundColor Gray
Write-Host "[*] Danh sach ung dung duoc BAO VE AN TOAN TUYET DOI:" -ForegroundColor Green
Write-Host "    - Remote: TeamViewer, AnyDesk, UltraViewer" -ForegroundColor Green
Write-Host "    - Development: Microsoft Edge, Docker, Android Studio, ADB, Emulator, IDE" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Dang dong cac ung dung ton RAM..." -ForegroundColor Magenta

# Danh sach cac ung dung ton RAM can dong
$killList = @(
    "chrome", "firefox", "brave", "opera", "vivaldi",
    "discord", "spotify", "steam", "zalo", "telegram",
    "teams", "slack", "skype", "outlook", "winword", "excel", "powerpnt",
    "notion", "postman", "viber", "torrent", "epicgameslauncher"
)

$closedCount = 0
foreach ($app in $killList) {
    $procs = Get-Process -Name $app -ErrorAction SilentlyContinue
    if ($procs) {
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "  [-] Da dong ung dung: $app" -ForegroundColor Yellow
        $closedCount++
    }
}

if ($closedCount -eq 0) {
    Write-Host "  [+] Khong co ung dung ton RAM nao can dong." -ForegroundColor Gray
}

# Thu gom Garbage Collection
try {
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
} catch {}

Start-Sleep -Seconds 1

# 2. Tinh toan RAM sau khi don dep
$osAfter = Get-CimInstance Win32_OperatingSystem
$freeRAMAfter = [math]::Round($osAfter.FreePhysicalMemory / 1MB, 2)
$usedRAMAfter = [math]::Round($totalRAM - $freeRAMAfter, 2)
$freed = [math]::Round($freeRAMAfter - $freeRAMBefore, 2)

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " [OK] DA GIAI PHONG RAM THANH CONG!" -ForegroundColor Green
if ($freed -gt 0) {
    Write-Host "      Da giai phong them: +$freed GB RAM" -ForegroundColor Green
}
Write-Host "      RAM hien tai: Dung $usedRAMAfter GB / $totalRAM GB (Trong: $freeRAMAfter GB)" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nhan phim bat ky de thoat..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
