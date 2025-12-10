# Pygame Audio Troubleshooting

## Issue: "Cannot play fire alert audio: pygame not available"

Even though pygame is installed, the application might not be using the virtual environment's Python.

## Solution

### 1. Verify pygame is installed in the correct virtual environment:

```powershell
cd C:\Users\ankri\Music\gatelessparking-main\Main\.venv
.\Scripts\python.exe -c "import pygame; print('pygame OK')"
```

### 2. Make sure you're running from the virtual environment:

**Option A: Use the batch files** (recommended):
```powershell
cd C:\Users\ankri\Music\gatelessparking-main\Main
.\start-entry-camera.bat
```

**Option B: Activate virtual environment manually**:
```powershell
cd C:\Users\ankri\Music\gatelessparking-main\Main\.venv
.\Scripts\Activate.ps1
python main.py
```

**Option C: Run directly with venv Python**:
```powershell
cd C:\Users\ankri\Music\gatelessparking-main\Main\.venv
.\Scripts\python.exe main.py
```

### 3. Check which Python is being used:

When the application starts, it should show which Python executable is running. Make sure it's:
- `C:\Users\ankri\Music\gatelessparking-main\Main\.venv\Scripts\python.exe`

NOT:
- `C:\Users\ankri\AppData\Local\Programs\Python\...` (system Python)

### 4. Reinstall pygame if needed:

```powershell
cd C:\Users\ankri\Music\gatelessparking-main\Main\.venv
.\Scripts\pip.exe install --upgrade pygame
```

## Expected Behavior

When fire is detected, you should see:
```
[FIRE AUDIO] [OK] Fire alert audio system initialized
[FIRE AUDIO] [OK] Fire alert audio started (will auto-stop after 5 minutes)
```

NOT:
```
Cannot play fire alert audio: pygame not available
```

## Debug Steps

1. Check terminal for Python path when application starts
2. Verify pygame import works: `.\Scripts\python.exe -c "import pygame"`
3. Check that audio file exists: `C:\Users\ankri\Music\gatelessparking-main\Main\.venv\ma-ka-bhosda-aag.mp3`
4. Make sure you're using the batch files or venv Python directly

