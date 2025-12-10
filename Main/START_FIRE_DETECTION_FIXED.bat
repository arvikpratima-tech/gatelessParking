@echo off
echo ================================================================================
echo   FIRE DETECTION SYSTEM - FIXED VERSION
echo ================================================================================
echo.
echo This script ensures the correct Python environment is used
echo.

REM Change to .venv directory
cd /d "%~dp0.venv"

REM Check if virtual environment exists
if not exist "Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo Expected: %CD%\Scripts\python.exe
    echo.
    echo Please set up the virtual environment first
    pause
    exit /b 1
)

REM Display environment info
echo [INFO] Using Python environment:
echo   Location: %CD%
echo   Python: Scripts\python.exe
echo.

REM Check Python version
echo [INFO] Python version:
Scripts\python.exe --version
echo.

REM Check ultralytics version
echo [INFO] ultralytics version:
Scripts\python.exe -c "import ultralytics; print('  ultralytics:', ultralytics.__version__)"
echo.

REM Check if model exists
if exist "firedetect-11x.pt" (
    echo [OK] Model file found: firedetect-11x.pt
) else if exist "model.pt" (
    echo [OK] Model file found: model.pt
) else (
    echo [WARNING] No model file found in .venv directory
    echo   Expected: firedetect-11x.pt or model.pt
)

REM Check if audio exists
if exist "ma-ka-bhosda-aag.mp3" (
    echo [OK] Audio file found: ma-ka-bhosda-aag.mp3
) else (
    echo [WARNING] Audio file not found: ma-ka-bhosda-aag.mp3
)
echo.

REM Set environment variables for fire detection
set FIRE_MODEL_PATH=firedetect-11x.pt
set ENABLE_FIRE_DETECTION=true
set FIRE_DETECTION_INTERVAL=3
set FIRE_CONFIDENCE_THRESHOLD=0.15
set FIRE_AUDIO_FILE=ma-ka-bhosda-aag.mp3

echo [INFO] Fire detection configuration:
echo   FIRE_MODEL_PATH=%FIRE_MODEL_PATH%
echo   ENABLE_FIRE_DETECTION=%ENABLE_FIRE_DETECTION%
echo   FIRE_DETECTION_INTERVAL=%FIRE_DETECTION_INTERVAL%
echo   FIRE_CONFIDENCE_THRESHOLD=%FIRE_CONFIDENCE_THRESHOLD%
echo   FIRE_AUDIO_FILE=%FIRE_AUDIO_FILE%
echo.

echo ================================================================================
echo   Starting Application...
echo ================================================================================
echo.

REM Run the application
Scripts\python.exe main.py

echo.
echo ================================================================================
echo   Application Exited
echo ================================================================================
pause

