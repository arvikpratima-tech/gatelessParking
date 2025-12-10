# Fire Detection Troubleshooting Guide

## Issue: Fire Detection Not Working

If fire detection is not working even when pointing the camera at a burning car, check the following:

## 1. Check if Image is Being Sent from Python ALPR

**Problem**: The Python ALPR system might not be sending the `imageBase64` field in the API request.

**Solution**: 
- Check your Python ALPR code that sends data to `/api/plate`
- Ensure you're encoding the image as base64 and including it in the request
- Example:
  ```python
  import base64
  import cv2
  
  # Capture frame from camera
  ret, frame = camera.read()
  
  # Encode as base64
  _, buffer = cv2.imencode('.jpg', frame)
  image_base64 = base64.b64encode(buffer).decode('utf-8')
  
  # Include in API request
  payload = {
      "plate": detected_plate,
      "address": "Your Address",
      "imageBase64": image_base64,  # Make sure this is included!
      "zoneName": "Gate 1",
      # ... other fields
  }
  ```

## 2. Check Hugging Face API Configuration

**Problem**: The Hugging Face API token might not be set or the model might not exist.

**Check**:
1. Verify `HF_API_TOKEN` is set in your `.env` file
2. Check backend logs for errors like:
   - `HF_API_TOKEN not set`
   - `Fire detection API error: 404` (model not found)
   - `Fire detection API error: 503` (model loading)

**Solution**:
```env
HF_API_TOKEN=your_huggingface_token_here
FIRE_DETECTION_MODEL=Subh775/Fire-Detection-YOLOv8n
```

## 3. Check Backend Logs

**Look for these log messages**:
- `[PLATE API] Received request:` - Shows if image was received
- `[PLATE API] Running fire detection...` - Shows if fire detection started
- `[FIRE DETECTION] Calling Hugging Face API` - Shows API call
- `[FIRE DETECTION] Raw API response:` - Shows what API returned
- `[FIRE DETECTION] Found X raw detections` - Shows detections found
- `[FIRE DETECTION] Final result: X fire(s) detected` - Final count

**If you see errors**:
- `Model is loading` - Wait a few minutes and try again
- `404 Not Found` - Model doesn't exist, try different model
- `401 Unauthorized` - Check HF_API_TOKEN

## 4. Test Fire Detection Directly

**Test the API endpoint directly**:

```bash
curl -X POST http://localhost:3000/api/security/fire-detection \
  -F "image=@test_fire_image.jpg"
```

Or using Python:
```python
import requests
import base64

# Read image
with open("test_fire_image.jpg", "rb") as f:
    image_data = f.read()
    image_base64 = base64.b64encode(image_data).decode('utf-8')

# Test fire detection
response = requests.post(
    "http://localhost:3000/api/security/fire-detection",
    json={"imageBase64": image_base64}
)

print(response.json())
```

## 5. Use Local Python Fire Detection (Alternative)

If Hugging Face API is not working, you can use local Python fire detection:

1. **Install dependencies**:
   ```bash
   pip install ultralytics opencv-python
   ```

2. **Use the Python module**:
   ```python
   from security_fire_detection import detect_fire
   
   # Detect fire in image
   fires = detect_fire("path/to/image.jpg", confidence_threshold=0.25)
   
   if fires:
       print(f"Fire detected! {len(fires)} instance(s)")
       # Play audio alert
       from security_fire_audio import play_fire_alert
       play_fire_alert()
   ```

3. **Train or download a fire detection model**:
   - Download a pre-trained fire detection YOLO model
   - Or train your own using fire detection datasets
   - Place model file in `Main/` directory
   - Set `FIRE_MODEL_PATH` environment variable

## 6. Check Model Availability

The default model `Subh775/Fire-Detection-YOLOv8n` might not exist on Hugging Face.

**Try these alternatives**:
1. Use a different fire detection model from Hugging Face
2. Use local YOLO model (see section 5)
3. Train your own fire detection model

## 7. Verify Image Quality

**Fire detection requires**:
- Clear, well-lit images
- Fire/flames visible in frame
- Good image resolution (at least 640x480)

**Test with**:
- Clear fire images from internet
- Your camera feed
- Saved frames from camera

## 8. Check Confidence Threshold

The confidence threshold is set to 0.2 (20%). If fires are detected but filtered out:

- Lower threshold: Change in `lib/security/fire-detection.ts`:
  ```typescript
  const passesThreshold = score > 0.15; // Lower from 0.2
  ```

- Check logs to see if detections are being filtered:
  ```
  [FIRE DETECTION] Found X raw detections
  [FIRE DETECTION] Final result: 0 fire(s) detected
  ```
  This means detections were found but filtered out.

## 9. Enable Debug Mode

Add more logging to see what's happening:

In `app/api/plate/route.ts`, the logs should show:
- If image was received
- If fire detection was called
- What the API returned
- What fires were detected

## 10. Common Issues

| Issue | Solution |
|-------|----------|
| No image sent from Python | Add `imageBase64` to API request |
| HF_API_TOKEN not set | Add to `.env` file |
| Model not found (404) | Use different model or local detection |
| Model loading (503) | Wait 2-3 minutes for model to load |
| No fires detected | Lower confidence threshold, check image quality |
| API errors | Check network, verify HF token |

## Quick Test Checklist

- [ ] Python ALPR is sending `imageBase64` in request
- [ ] `HF_API_TOKEN` is set in `.env`
- [ ] Backend logs show `[PLATE API] Running fire detection...`
- [ ] Backend logs show `[FIRE DETECTION] Calling Hugging Face API`
- [ ] No 404/401/503 errors in logs
- [ ] Image contains visible fire/flames
- [ ] Test with known fire image first

## Next Steps

1. Check backend console logs when testing
2. Verify Python ALPR is sending images
3. Test fire detection API endpoint directly
4. Consider using local Python fire detection if API doesn't work



