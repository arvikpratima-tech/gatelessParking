@echo off
echo ========================================
echo   EXIT CAMERA - Starting ALPR System
echo ========================================
echo.
cd /d "%~dp0.venv"
if exist "Scripts\python.exe" (
    echo Starting Exit Camera Application...
    echo Using Python: %CD%\Scripts\python.exe
    echo.
    Scripts\python.exe main.py
    echo.
    echo Application exited
    pause
) else (
    echo ERROR: Python environment not found!
    echo Expected location: %CD%\Scripts\python.exe
    echo Please ensure virtual environment is set up
    echo.
    pause
)





