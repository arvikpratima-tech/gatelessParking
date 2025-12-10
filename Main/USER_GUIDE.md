# User Guide - ALPR with Security Features

## Quick Start - How to Run the Program

### Step 1: Start the Application
```bash
cd Main/.venv
.\Scripts\python.exe main.py
```

The GUI window will open with all controls and displays.

---

## GUI Layout Overview

The application window has several sections:

1. **Camera Settings** - Configure and start/stop camera
2. **Smart Detection Control** - Auto/Manual modes, pause, reset
3. **Detection Statistics** - Shows total detections, sent, skipped
4. **Vehicle Information** - Shows detected plate, booking status, timestamps
5. **Video Display** - Live camera feed
6. **Status Bar** - Current system status
7. **Activity Log** - Timestamped activity messages

---

## How to Use - Step by Step

### 1. Setting Up Camera

**Option A: IP Webcam (Android)**
1. Install "IP Webcam" app on your Android phone
2. Start the server in the app
3. Note the IP address shown (e.g., `192.168.1.100`)
4. In the ALPR app, click the "IP Webcam" preset button (fills in URL automatically)
5. Or manually enter: `http://[YOUR_IP]:8080/video`

**Option B: DroidCam**
1. Install DroidCam on phone and PC
2. Start DroidCam on both devices
3. Click "DroidCam" preset button
4. Or enter: `http://[YOUR_IP]:4747/video`

**Option C: USB Webcam**
- Enter: `0` (for default webcam)
- Or: `1`, `2`, etc. for multiple cameras

**Option D: Custom URL**
- Enter any RTSP/MJPEG stream URL directly

---

### 2. Detection Modes

#### **Auto Mode** (Default - Green Button)
- ✅ **Automatic continuous detection**
- Detects plates continuously as vehicles pass
- No manual intervention needed
- **Best for:** Live monitoring at gates/entrances

**How to use:**
1. Click "Auto Mode" button (should be green/active)
2. Click "Start Camera"
3. System automatically detects plates every frame

#### **Manual Mode** (Blue Button)
- 🔍 **Manual trigger detection**
- Only detects when you click "Detect Plate Now"
- **Best for:** Testing or when you want control

**How to use:**
1. Click "Manual Mode" button (turns blue)
2. Click "Start Camera"
3. Click "Detect Plate Now" when a vehicle is visible

---

### 3. Understanding the Two Timestamps

When a plate is detected, you'll see **TWO timestamps** in the Vehicle Information section:

#### **Timestamp 1: First Detection (Entry Time)**
- Shown as: `Entry Time: [HH:MM:SS]`
- When the vehicle was **first detected** in this session
- Used to calculate **local stay duration**
- This is the time the vehicle entered the monitored area

#### **Timestamp 2: Latest Detection (Last Seen)**
- Shown as: `Last Seen: [HH:MM:SS]`
- The **most recent** detection of this same plate
- Updates every time the same vehicle is detected again
- Shows the vehicle is still present

#### **Duration Calculation**
- **Local Stay Duration**: Time since first detection (Entry Time)
  - Example: `Stay Duration: 0h 15m` (15 minutes since entry)
- **Booking Duration**: From booking start/end times (if booking exists)
- **Remaining Time**: How much time left in booking period

**Example Display:**
```
🚗 Vehicle: MH20EE7602
Entry Time: 14:30:15
Last Seen: 14:45:30

⏱️ Stay Duration: 0h 15m
⏳ Remaining: 2h 45m
```

---

### 4. Security Features (New!)

#### **Threat Detection**
The system automatically detects weapons/threats in video frames.

**How it works:**
- Runs in background (every 5th frame by default)
- Detects: guns, knives, firearms, weapons
- Doesn't slow down plate detection
- Silent if no threats found

**When a threat is detected:**
1. 🚨 **Security Alert** appears in Status Bar
2. 🔊 **Audio announcement** plays automatically
3. 📝 **Alert text** shows in Activity Log
4. Alert message includes:
   - Vehicle plate number (if detected)
   - Zone/location
   - Threat type (gun, knife, etc.)

**Alert Example:**
```
🚨 SECURITY ALERT: Attention security. Black SUV near Gate 3, plate MH20EE7602. 
Possible gun detected. Please respond immediately.
```

#### **Text-to-Speech (TTS)**
- Automatically speaks security alerts
- Uses natural voice
- Plays in separate thread (doesn't block detection)

#### **Configuration**

Edit `.env` file or set environment variables:

```bash
# Enable/disable threat detection
ENABLE_THREAT_DETECTION=true

# Check every Nth frame (lower = more frequent, higher = faster)
THREAT_DETECTION_INTERVAL=5

# Minimum confidence (0.0 to 1.0)
THREAT_CONFIDENCE_THRESHOLD=0.25

# Enable/disable TTS audio alerts
ENABLE_TTS=true
```

---

### 5. Controls Explained

| Button | Function | When to Use |
|--------|----------|-------------|
| **Start Camera** | Start video feed | After setting camera URL |
| **Stop Camera** | Stop video feed | To pause or change settings |
| **Auto Mode** | Continuous detection | Live monitoring |
| **Manual Mode** | Manual detection | Testing or controlled detection |
| **Detect Plate Now** | Trigger detection | Only works in Manual Mode |
| **Pause Detection** | Pause/Resume | Temporarily stop detecting |
| **Reset Detection History** | Clear all records | Start fresh session |

---

### 6. Understanding Status Messages

#### **Vehicle Information Panel**

**Green Background** ✅
- Vehicle has valid booking
- Within booking time period
- Shows booking details

**Red Background** 🚨
- VIOLATION: No booking found
- Vehicle is unauthorized

**Orange Background** ⚠️
- Booking exists but vehicle is OVERSTAYED
- Past booking end time

**Blue Background** ℹ️
- Booking exists but hasn't started yet
- Before booking start time

---

### 7. Activity Log

The log shows all events with timestamps:

```
[14:30:15] 🎥 Starting camera: http://192.168.1.100:8080/video
[14:30:20] ✅ Camera connected
[14:31:05] 📋 Processing new plate: MH20EE7602 (raw: MH20EE7602)
[14:31:05] ✅ Plate sent to backend successfully
[14:31:10] 🚨 SECURITY ALERT: Attention security. Black SUV near Gate 3...
[14:32:18] 🔊 Security alert audio played
```

**Log Messages:**
- 🎥 Camera events
- 📋 Plate detections
- ✅ Success messages
- ❌ Errors
- 🚨 Security alerts
- 🔊 Audio playback

---

## Troubleshooting

### Camera Not Connecting
1. Check camera URL is correct
2. Ensure camera app/server is running
3. Check network connectivity
4. Try different preset buttons
5. Verify firewall isn't blocking connection

### Plates Not Detecting
1. Ensure good lighting
2. Plate should be clearly visible
3. Plate should be at least 50x150 pixels
4. Try "Reset Detection History"
5. Check Activity Log for error messages

### Security Alerts Not Working
1. Check `.env` file has `ENABLE_THREAT_DETECTION=true`
2. Verify `HF_API_TOKEN` is set (if using Hugging Face API)
3. Models load automatically on first use (may take time)
4. Check Activity Log for error messages
5. Threat detection runs every Nth frame - may take a few seconds

### Audio Not Playing
1. Check system volume
2. Verify `ENABLE_TTS=true` in config
3. Models may still be loading (check Activity Log)
4. Audio plays in background - check system audio settings

---

## Tips for Best Results

1. **Camera Position**
   - Mount camera 6-8 feet high
   - Angle 30-45 degrees downward
   - Ensure good lighting
   - Avoid direct sunlight on plate

2. **Detection Settings**
   - Use Auto Mode for live monitoring
   - Use Manual Mode for testing
   - Reset history when switching locations

3. **Performance**
   - Threat detection runs every 5th frame (configurable)
   - Lower interval = more detection, slower performance
   - Higher interval = faster, less frequent checks

4. **Security**
   - Alerts play automatically
   - Check Activity Log for detailed threat info
   - Alert includes plate number when available

---

## Example Workflow

### Scenario: Monitoring Parking Gate

1. **Setup**
   - Enter camera URL: `http://192.168.1.100:8080/video`
   - Click "Auto Mode" (should be green)
   - Click "Start Camera"

2. **Monitoring**
   - Watch video feed
   - System automatically detects plates
   - Check Vehicle Information panel for details
   - Watch Activity Log for events

3. **Security Alert**
   - If threat detected, alert plays automatically
   - Check Status Bar for alert message
   - Review Activity Log for details
   - Alert includes vehicle plate if detected

4. **Checking Vehicles**
   - View Vehicle Information panel
   - See Entry Time and Last Seen timestamps
   - Check booking status (green = OK, red = violation)
   - Monitor stay duration

5. **End of Day**
   - Click "Stop Camera"
   - Review Activity Log
   - Check statistics

---

## Keyboard Shortcuts

Currently, all controls are via mouse clicks. No keyboard shortcuts implemented.

---

## Need Help?

Check the Activity Log for detailed error messages and system status. All events are timestamped and logged there.

For technical issues, check:
- `Main/FIXES_SUMMARY.md` - Known issues and fixes
- Activity Log in the application
- Console output if running from terminal








