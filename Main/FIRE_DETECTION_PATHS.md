# Fire Detection File Paths - Verified

## Your File Locations

Based on your setup, the files are located at:

1. **Fire Detection Model**:
   - `C:\Users\ankri\Music\gatelessparking-main\Main\.venv\model.pt`

2. **Fire Alert Audio**:
   - `C:\Users\ankri\Music\gatelessparking-main\Main\.venv\ma-ka-bhosda-aag.mp3`

## Configuration

Your `.env` file in `Main/.venv/` should have:

```env
# Fire Detection
ENABLE_FIRE_DETECTION=true
FIRE_MODEL_PATH=model.pt
FIRE_DETECTION_INTERVAL=5
FIRE_CONFIDENCE_THRESHOLD=0.25

# Fire Alert Audio
FIRE_AUDIO_FILE=ma-ka-bhosda-aag.mp3
FIRE_AUDIO_VOLUME=1.0
FIRE_AUDIO_AUTO_STOP_MINUTES=5
```

## Path Resolution

The system will automatically check these locations for the files:

### Model File (`model.pt`):
- `Main/model.pt`
- `Main/.venv/model.pt` ✅ (Your location)
- Current directory
- Current directory/.venv/

### Audio File (`ma-ka-bhosda-aag.mp3`):
- `Main/ma-ka-bhosda-aag.mp3`
- `Main/.venv/ma-ka-bhosda-aag.mp3` ✅ (Your location)
- Current directory
- Current directory/.venv/

## Verification

When you run the camera system, you should see:

```
[FIRE DETECTION] Found model at: C:\Users\ankri\Music\gatelessparking-main\Main\.venv\model.pt
[FIRE DETECTION] Loading fire detection model: ...
[FIRE DETECTION] [OK] Fire detection model loaded successfully
[FIRE DETECTION] Model has X classes
[FIRE DETECTION] Class names: [...]
```

And when fire is detected:
```
[AUDIO] Fire alert audio started
```

If you see "audio file not found", check that the filename matches exactly: `ma-ka-bhosda-aag.mp3`

