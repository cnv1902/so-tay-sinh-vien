@echo off
chcp 65001 > nul
title RAM Cleaner - VinhUni Pocket Guide Optimizer
color 0B

echo ==============================================================================
echo              CONG CU GIAI PHONG BO NHO RAM - VINHUNI GUIDE
echo ==============================================================================
echo.
echo [*] Dang tien hanh dong cac tien trinh ton RAM khong can thiet...
echo [*] BAO VE AN TOAN: TeamViewer, AnyDesk, UltraViewer, Edge, Docker, Android Studio.
echo.

REM Danh sach cac ung dung ngam ton RAM can dong
set APPS=chrome.exe firefox.exe brave.exe opera.exe vivaldi.exe discord.exe spotify.exe steam.exe zalo.exe telegram.exe teams.exe slack.exe skype.exe winword.exe excel.exe powerpnt.exe outlook.exe notion.exe postman.exe viber.exe epicgameslauncher.exe

for %%P in (%APPS%) do (
    taskkill /F /IM %%P >nul 2>&1
    if not errorlevel 1 (
        echo   [-] Da dong: %%P
    )
)

echo.
echo [*] Dang don dep Standby Memory va Garbage Collection...
powershell -NoProfile -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()" >nul 2>&1

echo.
echo ==============================================================================
echo [OK] DA GIAI PHONG RAM THANH CONG!
echo May cua ban da san sang de chay Docker, Android Studio va Expo.
echo ==============================================================================
echo.
pause
