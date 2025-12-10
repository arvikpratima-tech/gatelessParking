# Fire Detection Integration Example

## Quick Integration into main.py

Add fire detection to your camera loop **exactly like threat detection**:

### Step 1: Import at the top of main.py

```python
# Add this import (alongside threat detection imports)
from security_fire_integration_camera import detect_fire_in_frame, handle_fire_alert
```

### Step 2: Add to your camera processing loop

In your `PlateDetectionWorker.run()` method, add fire detection **after threat detection**:

```python
# In PlateDetectionWorker.run() method:

# ... existing plate detection code ...

# Threat detection (existing)
detected_threats = detect_threats_in_frame(
    self.current_frame_for_threats,
    self.frame_counter
)

# Fire detection (NEW - add this right after threat detection)
detected_fires = detect_fire_in_frame(
    self.current_frame,  # Same frame as plate/threat detection
    self.frame_counter
)

# Handle fire alert if detected
if detected_fires and len(detected_fires) > 0:
    handle_fire_alert(
        detected_fires,
        zone_name=self.config.location,  # Your location config
        plate=detected_plate  # If plate was detected
    )
```

### Step 3: Configuration

Add to `.env` file in `Main/.venv/`:

```env
# Fire Detection
ENABLE_FIRE_DETECTION=true
FIRE_MODEL_PATH=fire_detection.pt
FIRE_DETECTION_INTERVAL=5
FIRE_CONFIDENCE_THRESHOLD=0.25

# Fire Audio
FIRE_AUDIO_FILE=as-ma-ka-bhosada-aag.mp3
FIRE_AUDIO_VOLUME=1.0
```

### Step 4: Place Files

1. **Model file**: `Main/fire_detection.pt` (or whatever you name it)
2. **Audio file**: `Main/as-ma-ka-bhosada-aag.mp3`

## Complete Example

Here's how it looks in the camera loop:

```python
class PlateDetectionWorker(QThread):
    def run(self):
        frame_counter = 0
        
        while self.running:
            # Get frame from camera
            frame = self.get_frame()
            frame_counter += 1
            
            # Plate detection (existing)
            plate = self.detect_plate(frame)
            
            # Threat detection (existing)
            if frame_counter % THREAT_DETECTION_INTERVAL == 0:
                threats = detect_threats_in_frame(frame, frame_counter)
                if threats:
                    handle_threat_alert(threats)
            
            # Fire detection (NEW - same pattern)
            if frame_counter % FIRE_DETECTION_INTERVAL == 0:
                fires = detect_fire_in_frame(frame, frame_counter)
                if fires and len(fires) > 0:
                    handle_fire_alert(fires, zone_name=self.location, plate=plate)
```

## Both Work Together

- **Threat detection** and **Fire detection** run in the **same camera loop**
- Both use the **same frame**
- Both check every **Nth frame** (configurable)
- Both work **simultaneously** without conflicts
- **Fire audio** plays when fire detected
- **Threat TTS** plays when threat detected

## Testing

1. Place `fire_detection.pt` in `Main/` directory
2. Place `as-ma-ka-bhosada-aag.mp3` in `Main/` directory
3. Add the code to your `main.py`
4. Run the camera
5. Point at fire - should detect and play audio



