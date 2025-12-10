# Fire Detection Setup Guide

## Overview
Fire detection is now integrated into the ALPR camera system, working alongside threat detection in the same camera loop.

## Model File Setup

1. **Place your fire detection model file** in the `Main/` directory:
   - File name: `fire_detection.pt` (or set `FIRE_MODEL_PATH` env variable)
   - Example: `Main/fire_detection.pt`

2. **If you don't have a fire detection model**:
   - The system will fall back to `yolov8n.pt` (may not detect fire well)
   - For best results, use a trained fire detection model

## Configuration

Add to your `.env` file in `Main/.venv/`:

```env
# Enable/disable fire detection
ENABLE_FIRE_DETECTION=true

# Fire detection model file (place in Main/ directory)
FIRE_MODEL_PATH=fire_detection.pt

# Fire detection interval (check every Nth frame, same as threat detection)
FIRE_DETECTION_INTERVAL=5

# Fire detection confidence threshold (0-1)
FIRE_CONFIDENCE_THRESHOLD=0.25

# Fire alert audio file (place in Main/ directory)
FIRE_AUDIO_FILE=as-ma-ka-bhosada-aag.mp3

# Fire alert audio volume (0.0 to 1.0)
FIRE_AUDIO_VOLUME=1.0

# Auto-stop audio after N minutes
FIRE_AUDIO_AUTO_STOP_MINUTES=5
```

## Integration in Camera System

Fire detection works **exactly like threat detection**:

1. **Same camera loop** - Runs in `PlateDetectionWorker.run()`
2. **Same frame** - Uses the same frame as plate detection
3. **Interval-based** - Checks every Nth frame (default: every 5th frame)
4. **Non-blocking** - Doesn't slow down plate detection
5. **Automatic audio** - Plays fire alert audio when fire detected

## Code Integration

In your `main.py` (or camera processing code), add fire detection alongside threat detection:

```python
from security_fire_integration_camera import detect_fire_in_frame, handle_fire_alert

# In your camera loop (same place as threat detection):
# After plate detection...

# Check for fire (runs every Nth frame)
detected_fires = detect_fire_in_frame(
    self.current_frame,  # Same frame used for plate/threat detection
    self.frame_counter
)

# If fire detected, handle alert
if detected_fires and len(detected_fires) > 0:
    handle_fire_alert(
        detected_fires,
        zone_name=self.config.location,  # From your config
        plate=detected_plate  # If plate was detected
    )
```

## How It Works

```
Camera Frame
    ↓
Plate Detection (existing)
    ↓
Threat Detection (existing)
    ↓
Fire Detection (NEW - same frame)
    ↓
If Fire Detected:
    - Play fire alert audio (loops)
    - Log alert message
    - Show in UI (if integrated)
```

## Files Structure

```
Main/
├── fire_detection.pt          # Your fire detection model file
├── as-ma-ka-bhosada-aag.mp3  # Fire alert audio file
├── security_fire_detection.py # Fire detection module (uses .pt file)
├── security_fire_audio.py     # Audio playback module
├── security_fire_integration_camera.py  # Camera integration helper
└── security_fire_integration.py  # API response integration helper
```

## Testing

1. **Test fire detection module**:
   ```bash
   cd Main
   python security_fire_detection.py test_image.jpg
   ```

2. **Test audio**:
   ```bash
   python security_fire_audio.py
   ```

3. **Test in camera system**:
   - Start your ALPR camera
   - Point at fire/flame
   - Should detect fire and play audio

## Troubleshooting

1. **Model not found**:
   - Check `FIRE_MODEL_PATH` in `.env`
   - Ensure `.pt` file is in `Main/` directory
   - Check console for model loading messages

2. **Fire not detected**:
   - Lower `FIRE_CONFIDENCE_THRESHOLD` (try 0.15)
   - Check if model is trained for fire detection
   - Verify fire is visible in frame

3. **Audio not playing**:
   - Check `FIRE_AUDIO_FILE` path
   - Ensure `pygame` is installed: `pip install pygame`
   - Check console for audio errors

4. **Performance issues**:
   - Increase `FIRE_DETECTION_INTERVAL` (check every 10th frame instead of 5th)
   - Fire detection runs in same thread as plate detection

## Comparison with Threat Detection

| Feature | Threat Detection | Fire Detection |
|---------|------------------|----------------|
| Model File | `Subh775/Threat-Detection-YOLOv8n` (Hugging Face) | `fire_detection.pt` (local file) |
| Integration | Camera loop | Camera loop |
| Interval | Every Nth frame | Every Nth frame |
| Audio | TTS generated | MP3 file (loops) |
| Pattern | Same | Same |

Both work together in the same camera system without conflicts.



