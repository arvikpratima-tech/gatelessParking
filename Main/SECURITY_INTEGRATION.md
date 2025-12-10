# Security Features Integration into ALPR Video Pipeline

This document describes how weapon/threat detection and text-to-speech security alerts have been integrated directly into the existing ALPR video processing pipeline.

## Overview

The security pipeline is now fully integrated into `Main/.venv/main.py`, specifically in the `PlateDetectionWorker` class that processes video frames. When threats are detected, the system automatically generates and plays audio alerts.

## Integration Points

### 1. Model Loading (Cached, Thread-Safe)

**Location:** Global functions in `main.py` (after AppConfig)

- `get_weapon_model()` - Loads `Subh775/Threat-Detection-YOLOv8n` using Ultralytics YOLO
- `get_tts_pipeline()` - Loads `ai4bharat/indic-parler-tts` using Hugging Face transformers

Both models are:
- Loaded once on first use (cached)
- Thread-safe (using locks)
- Loaded in background threads (non-blocking startup)

### 2. Threat Detection in Video Loop

**Location:** `PlateDetectionWorker.run()` method (lines ~605-650)

The threat detection runs in the same loop as plate detection:

1. **Frame Processing:** When a frame is available in the queue
2. **Plate Detection:** First, ALPR runs (as before)
3. **Threat Detection:** Then, weapon detection runs on the same frame
4. **Interval-Based:** Threat detection runs on every Nth frame (configurable, default: every 5th frame)

```python
# Threat detection runs in PlateDetectionWorker.run()
detected_threats = detect_threats_in_frame(
    self.current_frame_for_threats,
    self.frame_counter
)
```

### 3. Alert Text Generation

**Location:** `build_security_alert_text()` function

Combines:
- Zone name (from `CONFIG.location`)
- Vehicle info (plate, color, type - when available)
- Threat labels (gun, knife, etc.)

Example output:
```
"Attention security. vehicle near Gate 3, plate KA01AB1234. Possible handgun detected. Please respond immediately."
```

### 4. Text-to-Speech Integration

**Location:** `synthesize_alert_audio()` function

- Converts alert text to speech using `ai4bharat/indic-parler-tts`
- Returns audio bytes (WAV format) and sampling rate
- Errors are logged but don't crash the video loop

### 5. Audio Playback

**Location:** `play_audio()` function

- Plays audio in background thread (non-blocking)
- Uses `sounddevice` library for playback
- Falls back gracefully if audio libraries not available

### 6. UI Integration

**Location:** `App.handle_security_alert()` method

When a threat is detected:
- Logs alert message
- Updates status label (red, bold)
- Shows popup dialog
- Audio is automatically played

## Configuration

Add these to your `.env` file in `Main/.venv/`:

```env
# Enable/disable security features
ENABLE_THREAT_DETECTION=true
ENABLE_TTS=true

# Model configuration
THREAT_DETECTION_MODEL=Subh775/Threat-Detection-YOLOv8n
TTS_MODEL=ai4bharat/indic-parler-tts

# Threat detection interval (check every Nth frame)
THREAT_DETECTION_INTERVAL=5

# Threat confidence threshold (0-1)
THREAT_CONFIDENCE_THRESHOLD=0.3
```

## How It Works

### Video Processing Flow

```
Camera Frame
    ↓
PlateDetectionWorker.run()
    ↓
[1] ALPR Detection (existing)
    ↓ (if plate found)
[2] Threat Detection (NEW - on same frame)
    ↓ (if threats found)
[3] Build Alert Text
    ↓
[4] Generate TTS Audio
    ↓
[5] Play Audio + Show Alert
```

### Frame Processing Details

1. **Frame arrives** from camera thread
2. **Plate detection** runs first (existing functionality)
3. **If plate detected:**
   - Plate is validated and sent to backend
   - Frame stored for threat detection
4. **Threat detection** runs:
   - Only on every Nth frame (performance optimization)
   - Uses same frame that ALPR used
   - Filters for threat classes (gun, knife, weapon, etc.)
5. **If threats detected:**
   - Alert text is built using plate + zone + threats
   - TTS generates audio
   - Audio plays in background
   - UI shows alert popup

## Performance Considerations

1. **Model Loading:** Models load once on startup (background thread)
2. **Frame Interval:** Threat detection runs every Nth frame (default: 5)
3. **Non-Blocking:** TTS and audio playback run in separate threads
4. **Error Handling:** All security features gracefully degrade if models fail

## Testing

1. **Install dependencies:**
   ```bash
   cd Main
   pip install -r requirements-security.txt
   ```

2. **Configure environment:**
   ```bash
   # In Main/.venv/.env
   ENABLE_THREAT_DETECTION=true
   ENABLE_TTS=true
   ```

3. **Run the application:**
   ```bash
   python main.py
   ```

4. **Test with weapon image:**
   - Point camera at image with weapon
   - System should detect threat
   - Alert popup appears
   - Audio plays automatically

## Key Features

✅ **Integrated into existing video loop** - No separate processing pipeline
✅ **Reuses same frames** - No extra frame capture overhead
✅ **Non-blocking** - Doesn't slow down ALPR detection
✅ **Configurable** - Can enable/disable via environment variables
✅ **Error-tolerant** - Failures don't crash video processing
✅ **Automatic alerts** - Audio plays and UI updates automatically
✅ **Links with ALPR** - Combines plate + zone + threats for alerts

## Files Modified

- `Main/.venv/main.py` - Integrated threat detection and TTS into video pipeline
- `Main/requirements-security.txt` - Added sounddevice for audio playback

## Notes

- Models download on first use (may take time first run)
- Audio playback requires `sounddevice` (optional, logs warning if missing)
- Threat detection confidence threshold is configurable (default: 0.3)
- Frame interval can be adjusted for performance vs. accuracy tradeoff








