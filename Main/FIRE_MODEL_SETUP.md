# Fire Detection Model Setup - model.pt

## Model File Setup

1. **Place your fire detection model file** in one of these locations:
   - `C:\Users\ankri\Documents\Main\.venv\model.pt` (recommended)
   - `C:\Users\ankri\Documents\Main\model.pt`
   - Or set `FIRE_MODEL_PATH` in `.env` to point to your model file

2. **Update `.env` file** in `Main/.venv/`:
   ```env
   # Fire Detection Configuration
   ENABLE_FIRE_DETECTION=true
   FIRE_MODEL_PATH=model.pt
   FIRE_DETECTION_INTERVAL=5
   FIRE_CONFIDENCE_THRESHOLD=0.25
   
   # Fire Alert Audio
   FIRE_AUDIO_FILE=as-ma-ka-bhosada-aag.mp3
   FIRE_AUDIO_VOLUME=1.0
   FIRE_AUDIO_AUTO_STOP_MINUTES=5
   ```

## Verification

When you run the camera system, check the terminal for:

1. **Model Loading**:
   ```
   [FIRE DETECTION] Found model at: C:\Users\ankri\Documents\Main\.venv\model.pt
   [FIRE DETECTION] Loading fire detection model: ...
   [FIRE DETECTION] [OK] Fire detection model loaded successfully
   [FIRE DETECTION] Model has X classes
   [FIRE DETECTION] Class names: [...]
   ```

2. **Model Detection**:
   - The model will show what class names it uses
   - If fire is detected, you'll see: `[FIRE ALERT] X fire instance(s) detected!`
   - If no fire but objects detected, you'll see debug info showing what was detected

## Troubleshooting

### Model Not Found
- Check that `model.pt` exists in the correct location
- Verify `FIRE_MODEL_PATH=model.pt` in `.env` file
- Check terminal for: `[FIRE DETECTION] Found model at: ...`

### Model Loaded But No Fire Detected
- Check terminal for: `[FIRE DETECTION] Class names: [...]`
- The model's class names must contain fire-related terms (fire, flame, smoke, etc.)
- If class names are different, we may need to update `FIRE_LABELS` in `security_fire_detection.py`

### False Positives
- Adjust `FIRE_CONFIDENCE_THRESHOLD` in `.env` (higher = less sensitive)
- Default is 0.25, try 0.3 or 0.4 for fewer false positives

## Model Class Names

The fire detection system looks for these labels in the model's class names:
- fire
- flame
- smoke
- burning
- blaze
- flames

If your model uses different class names, share them and we can update the filter.

