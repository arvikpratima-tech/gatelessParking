# Fire Detection Troubleshooting Guide

## Issue: Fire Detection Model Not Detecting Fire

### Possible Causes:

1. **Model class names don't match filter**
   - The model might use different class names (e.g., "Fire", "Flame", "Smoke" instead of lowercase)
   - Solution: The code now accepts ALL detections from fire detection models

2. **Confidence threshold too high**
   - Default: 0.25 (25%)
   - Try lowering: `FIRE_CONFIDENCE_THRESHOLD=0.15` in `.env`

3. **Model not loading correctly**
   - Check terminal for: `[FIRE DETECTION] Found model at: ...`
   - Check terminal for: `[FIRE DETECTION] [OK] Fire detection model loaded successfully`

4. **Model detecting but labels filtered out**
   - Check terminal for: `[FIRE DETECTION DEBUG] Model detected X object(s) but none matched fire labels`
   - This shows what the model is actually detecting

## Debug Steps:

### 1. Check Model Loading
Look for these messages when the application starts:
```
[FIRE DETECTION] Found model at: C:\Users\ankri\Music\gatelessparking-main\Main\.venv\model.pt
[FIRE DETECTION] [OK] Fire detection model loaded successfully
[FIRE DETECTION] Model has X classes
[FIRE DETECTION] Class names: [...]
```

### 2. Check Model Type
If your model filename contains "fire", "flame", "smoke", or "burn", ALL detections will be accepted:
```
[FIRE DETECTION] Treating as fire detection model: True
[FIRE DETECTION] [INFO] All detections from this model will be treated as fire
```

### 3. Check What Model is Detecting
When no fire is detected but objects are found, you'll see:
```
[FIRE DETECTION DEBUG] Model detected X object(s) but none matched fire labels:
  - Label: 'something' (confidence: 0.XX)
[FIRE DETECTION DEBUG] Model class names: [...]
```

### 4. Lower Confidence Threshold
In your `.env` file:
```env
FIRE_CONFIDENCE_THRESHOLD=0.15  # Lower = more sensitive
```

### 5. Check Detection Interval
Make sure fire detection is running:
```env
FIRE_DETECTION_INTERVAL=5  # Check every 5th frame
```

## Solutions:

### Solution 1: Use Fire Detection Model Name
If your model is named with "fire", "flame", "smoke", or "burn" in the filename:
- The system will accept ALL detections from it
- Example: `firedetect-11x.pt` → Will accept all detections

### Solution 2: Update FIRE_LABELS
If your model uses different class names, add them to `FIRE_LABELS` in `security_fire_detection.py`:
```python
FIRE_LABELS = ['fire', 'flame', 'smoke', 'burning', 'blaze', 'flames', 'YOUR_CLASS_NAME']
```

### Solution 3: Lower Confidence Threshold
```env
FIRE_CONFIDENCE_THRESHOLD=0.15
```

### Solution 4: Check Model Output
Run a test to see what the model detects:
```python
from security_fire_detection import detect_fire
result = detect_fire("test_image.jpg", save_results=True)
print(result)
```

## Expected Output When Fire Detected:

```
[FIRE DETECTION DEBUG] [OK] 1 fire detection(s) found!
  - fire: 0.85 confidence
[FIRE DETECTED] 1 fire instance(s) at frame 150
[FIRE ALERT] [FIRE DETECTED] at Main Gate Entry: fire
[AUDIO] Fire alert audio started
```

## If Still Not Working:

1. Share the terminal output showing:
   - Model loading messages
   - Class names
   - Debug messages when objects are detected
   - Any error messages

2. Test with a known fire image to verify the model works

3. Check that the model file is actually a fire detection model (not a general object detection model)

