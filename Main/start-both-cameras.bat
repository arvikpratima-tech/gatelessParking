@echo off
echo ========================================
echo   DUAL CAMERA SYSTEM - Starting Both
echo ========================================
echo.
echo This will start both Entry and Exit cameras
echo in separate windows.
echo.
echo IMPORTANT: Make sure you have configured:
echo   1. Entry camera .env file
echo   2. Exit camera .env file  
echo   3. Different camera URLs for each
echo   4. Different LOCATION_ID for each
echo.
pause
echo.
echo Starting Entry Camera...
start "ENTRY CAMERA" cmd /k "cd /d %~dp0.venv && Scripts\python.exe main.py"
timeout /t 2 /nobreak >nul
echo.
echo Starting Exit Camera...
start "EXIT CAMERA" cmd /k "cd /d %~dp0.venv && Scripts\python.exe main.py"
echo.
echo Both cameras started in separate windows!
echo.
pause







