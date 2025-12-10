# Dual Camera Setup Guide - Entry & Exit Points

This guide explains how to set up and operate two ALPR cameras - one for **Entry** and one for **Exit** - for comprehensive parking management.

## Overview

With dual camera setup, you can:
- ✅ Track vehicles entering the parking area (Entry Camera)
- ✅ Track vehicles leaving the parking area (Exit Camera)
- ✅ Monitor both points simultaneously
- ✅ Detect violations at both entry and exit
- ✅ Track complete vehicle journey (entry to exit)
- ✅ Better security monitoring at critical access points

---

## Setup Methods

There are **two approaches** to running dual cameras:

### Method 1: Two Separate Application Instances (Recommended)
Run two instances of the ALPR application simultaneously - one for each camera.

### Method 2: Single Application with Camera Switching
Use one application instance and manually switch between cameras (not recommended for production).

**We recommend Method 1** for continuous monitoring of both points.

---

## Method 1: Two Separate Instances (Recommended)

### Step 1: Prepare Two Separate Directories

Create two copies of your Main/.venv directory:

```bash
# Copy 1: Entry Camera
Main/.venv-entry/

# Copy 2: Exit Camera  
Main/.venv-exit/
```

Or use two separate virtual environments pointing to the same codebase.

### Step 2: Configure Entry Camera

**Location:** `Main/.venv-entry/.env`

```env
# Entry Camera Configuration
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=a9AM8ukxpJfxmrmPvSYewfjDhdYF1thD
LOCATION=Main Gate Entry
LOCATION_ID=entry-gate-1
CAMERA_ID=camera-entry-1

# Camera URL (Example: IP Webcam)
# Replace with your actual entry camera URL
CAMERA_URL=http://192.168.1.100:8080/video

# Performance Settings
FRAME_RESIZE_WIDTH=800
ENABLE_ROI=false
FRAME_SKIP=2
DETECTION_INTERVAL_MS=1000

# Security Settings
ENABLE_THREAT_DETECTION=true
ENABLE_TTS=true
THREAT_DETECTION_INTERVAL=5

# Plate Validator Settings
COOLDOWN_TIME=30
SIMILARITY_THRESHOLD=0.7
```

### Step 3: Configure Exit Camera

**Location:** `Main/.venv-exit/.env`

```env
# Exit Camera Configuration
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=a9AM8ukxpJfxmrmPvSYewfjDhdYF1thD
LOCATION=Main Gate Exit
LOCATION_ID=exit-gate-1
CAMERA_ID=camera-exit-1

# Camera URL (Example: IP Webcam - Different IP/Port)
# Replace with your actual exit camera URL
CAMERA_URL=http://192.168.1.101:8080/video

# Performance Settings (same as entry)
FRAME_RESIZE_WIDTH=800
ENABLE_ROI=false
FRAME_SKIP=2
DETECTION_INTERVAL_MS=1000

# Security Settings
ENABLE_THREAT_DETECTION=true
ENABLE_TTS=true
THREAT_DETECTION_INTERVAL=5

# Plate Validator Settings
COOLDOWN_TIME=30
SIMILARITY_THRESHOLD=0.7
```

### Step 4: Camera Hardware Setup

#### Entry Camera Setup
1. **Position:** Mount camera at entrance gate
2. **Height:** 6-8 feet high
3. **Angle:** 30-45 degrees downward
4. **Focus:** Point at license plates as vehicles enter
5. **Lighting:** Ensure good lighting, avoid direct sunlight on plates

#### Exit Camera Setup
1. **Position:** Mount camera at exit gate
2. **Height:** 6-8 feet high  
3. **Angle:** 30-45 degrees downward
4. **Focus:** Point at license plates as vehicles exit
5. **Lighting:** Ensure good lighting, avoid direct sunlight on plates

### Step 5: Camera URL Configuration

#### Option A: IP Webcam (Android)
**Entry Camera:**
- Install "IP Webcam" app on Android phone #1
- Set IP: `192.168.1.100:8080`
- Entry URL: `http://192.168.1.100:8080/video`

**Exit Camera:**
- Install "IP Webcam" app on Android phone #2
- Set IP: `192.168.1.101:8080`
- Exit URL: `http://192.168.1.101:8080/video`

#### Option B: USB Webcams
**Entry Camera:**
- Connect USB webcam #1
- Camera index: `0`
- Entry URL: `0`

**Exit Camera:**
- Connect USB webcam #2
- Camera index: `1`
- Exit URL: `1`

#### Option C: Network IP Cameras
**Entry Camera:**
- RTSP URL: `rtsp://192.168.1.100:554/stream1`
- Or MJPEG: `http://192.168.1.100:80/video`

**Exit Camera:**
- RTSP URL: `rtsp://192.168.1.101:554/stream1`
- Or MJPEG: `http://192.168.1.101:80/video`

### Step 6: Run Both Applications

#### Windows PowerShell:

**Terminal 1 - Entry Camera:**
```powershell
cd Main\.venv-entry
.\Scripts\python.exe main.py
```

**Terminal 2 - Exit Camera:**
```powershell
cd Main\.venv-exit
.\Scripts\python.exe main.py
```

#### Alternative: Create Batch Files

**Create `start-entry.bat`:**
```batch
@echo off
cd Main\.venv-entry
.\Scripts\python.exe main.py
pause
```

**Create `start-exit.bat`:**
```batch
@echo off
cd Main\.venv-exit
.\Scripts\python.exe main.py
pause
```

Double-click both files to start both cameras.

### Step 7: Configure Each Application

**Entry Camera Window:**
1. Enter entry camera URL in "Camera URL" field
2. Click "IP Webcam" or "DroidCam" preset if applicable
3. Select **Auto Mode** (green button)
4. Click **Start Camera**
5. Label window: "ENTRY CAMERA"

**Exit Camera Window:**
1. Enter exit camera URL in "Camera URL" field
2. Click "IP Webcam" or "DroidCam" preset if applicable
3. Select **Auto Mode** (green button)
4. Click **Start Camera**
5. Label window: "EXIT CAMERA"

---

## Method 2: Camera Switching (Single Instance)

If you only want to use one application instance:

1. Start the application
2. Configure Entry camera URL → Start camera → Monitor entry
3. When needed, stop camera
4. Configure Exit camera URL → Start camera → Monitor exit
5. Switch back and forth as needed

**Note:** This method doesn't allow simultaneous monitoring of both points.

---

## Backend Integration

### How Backend Distinguishes Entry vs Exit

The backend uses the `LOCATION_ID` and `CAMERA_ID` to differentiate:

**Entry Detection:**
```json
{
  "plate": "KA01AB1234",
  "address": "Main Gate Entry",
  "timestamp": "2024-01-15T10:30:00",
  "locationId": "entry-gate-1",
  "cameraId": "camera-entry-1"
}
```

**Exit Detection:**
```json
{
  "plate": "KA01AB1234",
  "address": "Main Gate Exit",
  "timestamp": "2024-01-15T14:30:00",
  "locationId": "exit-gate-1",
  "cameraId": "camera-exit-1"
}
```

### Backend Response Behavior

The backend will:
- ✅ Check booking status for both entry and exit
- ✅ At **Entry**: Validate booking exists and is active
- ✅ At **Exit**: Check if vehicle overstayed booking period
- ✅ Send violation emails for unauthorized vehicles
- ✅ Track complete parking session duration

---

## Best Practices

### 1. Naming Conventions

Use clear, descriptive names:
- **LOCATION**: `Main Gate Entry` / `Main Gate Exit`
- **LOCATION_ID**: `entry-gate-1` / `exit-gate-1`
- **CAMERA_ID**: `camera-entry-1` / `camera-exit-1`

### 2. Network Configuration

- Ensure both cameras are on the same network (or accessible)
- Test camera URLs before starting detection
- Use static IP addresses for cameras if possible

### 3. Performance Optimization

**For High Traffic:**
```env
# Reduce processing load
FRAME_SKIP=3
DETECTION_INTERVAL_MS=2000
THREAT_DETECTION_INTERVAL=10
```

**For Better Detection:**
```env
# Increase detection frequency
FRAME_SKIP=1
DETECTION_INTERVAL_MS=500
```

### 4. Security Settings

Enable threat detection at both points:
```env
ENABLE_THREAT_DETECTION=true
ENABLE_TTS=true
THREAT_DETECTION_INTERVAL=5
THREAT_CONFIDENCE_THRESHOLD=0.3
```

### 5. Monitoring Both Windows

- Position windows side-by-side on your monitor
- Use Activity Log to track events from both cameras
- Monitor detection statistics for both entry and exit

---

## Troubleshooting

### Camera 1 Works, Camera 2 Doesn't

**Check:**
1. Camera URL is correct and different from Camera 1
2. Camera is accessible on network
3. No port conflicts
4. Camera app/server is running

**Solution:**
```bash
# Test camera URL in browser
# Should show video stream
http://192.168.1.101:8080/video
```

### Both Cameras Show Same Video

**Problem:** Both applications are using the same camera URL.

**Solution:** 
- Verify `.env` files have different `CAMERA_URL` values
- Check camera URL field in each application window
- Ensure each camera has unique IP address/port

### High CPU Usage with Two Instances

**Solution:**
```env
# Increase frame skipping
FRAME_SKIP=3
DETECTION_INTERVAL_MS=2000

# Disable ROI processing if not needed
ENABLE_ROI=false

# Reduce threat detection frequency
THREAT_DETECTION_INTERVAL=10
```

### Network Errors on One Camera

**Check:**
1. Camera connectivity
2. Network stability
3. Backend API is accessible (`http://localhost:3000`)
4. `APP_KEY` matches backend configuration

### Duplicate Detections

**Solution:**
```env
# Increase cooldown time
COOLDOWN_TIME=60

# Increase similarity threshold
SIMILARITY_THRESHOLD=0.8
```

---

## Usage Workflow

### Daily Startup Routine

1. **Start Backend Server:**
   ```bash
   npm run dev
   ```

2. **Start Entry Camera:**
   - Open Terminal 1
   - Run entry camera application
   - Verify camera connection
   - Enable Auto Mode
   - Start detection

3. **Start Exit Camera:**
   - Open Terminal 2
   - Run exit camera application
   - Verify camera connection
   - Enable Auto Mode
   - Start detection

4. **Monitor Both:**
   - Keep both windows visible
   - Watch Activity Logs for events
   - Monitor detection statistics

### During Operation

- **Entry Camera:** Detects vehicles entering, validates bookings
- **Exit Camera:** Detects vehicles leaving, checks for overstays
- **Both:** Monitor for security threats, log all events

### End of Day

1. Stop both camera applications
2. Review Activity Logs
3. Check backend for violations/reports
4. Save configuration for next day

---

## Advanced Configuration

### Different Settings for Entry vs Exit

**Entry Camera (Higher Security):**
```env
# More frequent threat detection
THREAT_DETECTION_INTERVAL=3
THREAT_CONFIDENCE_THRESHOLD=0.25

# Faster detection for quick validation
DETECTION_INTERVAL_MS=500
```

**Exit Camera (Optimized Performance):**
```env
# Less frequent threat detection
THREAT_DETECTION_INTERVAL=8

# Standard detection interval
DETECTION_INTERVAL_MS=1000
```

### Multiple Entry/Exit Points

For multiple gates, create separate configurations:

```
Main/.venv-entry-gate1/
Main/.venv-entry-gate2/
Main/.venv-exit-gate1/
Main/.venv-exit-gate2/
```

Each with unique `LOCATION_ID` and `CAMERA_ID`.

---

## Example Configuration Files

### Entry Camera Complete Config

**File: `Main/.venv-entry/.env`**
```env
# Entry Camera Configuration
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=a9AM8ukxpJfxmrmPvSYewfjDhdYF1thD
LOCATION=Main Gate Entry
LOCATION_ID=entry-gate-1
CAMERA_ID=camera-entry-1

# Camera Settings
CAMERA_URL=http://192.168.1.100:8080/video

# Performance
FRAME_RESIZE_WIDTH=800
ENABLE_ROI=false
ROI_BOTTOM_PERCENT=0.4
FRAME_SKIP=2
DETECTION_INTERVAL_MS=1000
MAX_QUEUE_SIZE=3

# Plate Validation
COOLDOWN_TIME=30
SIMILARITY_THRESHOLD=0.7
MAX_HISTORY=10
HISTORY_CLEANUP_SECONDS=300

# Camera Hardware
CAMERA_BUFFER_SIZE=1
CAMERA_FPS=15
CAMERA_FRAME_DELAY_MS=50
MAX_CONSECUTIVE_FAILURES=10
CONNECTION_RETRY_DELAY_MS=5000

# Network
REQUEST_TIMEOUT=30
MAX_NETWORK_ERRORS=3
REQUEST_RETRIES=2
RETRY_DELAY=2

# Security
ENABLE_THREAT_DETECTION=true
THREAT_DETECTION_MODEL=Subh775/Threat-Detection-YOLOv8n
THREAT_DETECTION_INTERVAL=5
THREAT_CONFIDENCE_THRESHOLD=0.3

# TTS
ENABLE_TTS=true
TTS_MODEL=ai4bharat/indic-parler-tts
```

### Exit Camera Complete Config

**File: `Main/.venv-exit/.env`**
```env
# Exit Camera Configuration
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=a9AM8ukxpJfxmrmPvSYewfjDhdYF1thD
LOCATION=Main Gate Exit
LOCATION_ID=exit-gate-1
CAMERA_ID=camera-exit-1

# Camera Settings
CAMERA_URL=http://192.168.1.101:8080/video

# Performance (same as entry)
FRAME_RESIZE_WIDTH=800
ENABLE_ROI=false
ROI_BOTTOM_PERCENT=0.4
FRAME_SKIP=2
DETECTION_INTERVAL_MS=1000
MAX_QUEUE_SIZE=3

# Plate Validation
COOLDOWN_TIME=30
SIMILARITY_THRESHOLD=0.7
MAX_HISTORY=10
HISTORY_CLEANUP_SECONDS=300

# Camera Hardware
CAMERA_BUFFER_SIZE=1
CAMERA_FPS=15
CAMERA_FRAME_DELAY_MS=50
MAX_CONSECUTIVE_FAILURES=10
CONNECTION_RETRY_DELAY_MS=5000

# Network
REQUEST_TIMEOUT=30
MAX_NETWORK_ERRORS=3
REQUEST_RETRIES=2
RETRY_DELAY=2

# Security
ENABLE_THREAT_DETECTION=true
THREAT_DETECTION_MODEL=Subh775/Threat-Detection-YOLOv8n
THREAT_DETECTION_INTERVAL=5
THREAT_CONFIDENCE_THRESHOLD=0.3

# TTS
ENABLE_TTS=true
TTS_MODEL=ai4bharat/indic-parler-tts
```

---

## Verification Checklist

Before starting operations, verify:

- [ ] Backend server is running on `http://localhost:3000`
- [ ] Entry camera URL is accessible and working
- [ ] Exit camera URL is accessible and working
- [ ] Entry `.env` has correct `LOCATION_ID` and `CAMERA_ID`
- [ ] Exit `.env` has correct `LOCATION_ID` and `CAMERA_ID`
- [ ] Both `.env` files have same `APP_KEY` as backend
- [ ] Both cameras are properly positioned and focused
- [ ] Both applications can start without errors
- [ ] Test detection on both cameras separately
- [ ] Verify backend receives detections from both cameras

---

## Support

For issues or questions:
1. Check Activity Log in both applications
2. Review `Main/USER_GUIDE.md` for general usage
3. Check `Main/FIXES_SUMMARY.md` for known issues
4. Verify backend logs at `http://localhost:3000`

---

**Last Updated:** 2024-12-08
**Version:** 1.0







