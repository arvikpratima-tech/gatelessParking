# Quick Start Guide

## 🚀 Running the Application

### Single Camera Setup
```bash
cd Main/.venv
.\Scripts\python.exe main.py
```

### Dual Camera Setup (Entry & Exit)
For running two cameras simultaneously, see **DUAL_CAMERA_SETUP_GUIDE.md**

Quick start:
```bash
# Method 1: Use batch files (Windows)
start-both-cameras.bat

# Method 2: Manual start
# Terminal 1 - Entry:
cd Main/.venv
.\Scripts\python.exe main.py

# Terminal 2 - Exit:
cd Main/.venv
.\Scripts\python.exe main.py
```

---

## 📋 Basic Steps

1. **Enter Camera URL** (or use preset buttons)
2. **Click "Auto Mode"** (green) - for continuous detection
3. **Click "Start Camera"**
4. **Watch for detections** in Vehicle Information panel

---

## 🕐 Understanding the Two Timestamps

### Entry Time (First Detection)
- When vehicle **first appeared**
- Used for stay duration calculation
- Example: `Entry Time: 14:30:15`

### Last Seen (Latest Detection)  
- **Most recent** detection of same vehicle
- Updates every time vehicle is seen again
- Example: `Last Seen: 14:45:30`

### Duration Display
- **Stay Duration**: Time since entry (e.g., `0h 15m`)
- **Remaining**: Time left in booking (e.g., `2h 45m`)
- **Overstayed**: Time past booking end (e.g., `⚠️ Overstayed by: 0h 30m`)

---

## 🚨 Security Features (NEW!)

### Automatic Threat Detection
- ✅ Runs automatically in background
- ✅ Detects weapons (guns, knives, etc.)
- ✅ Doesn't slow down plate detection
- ✅ Checks every 5th frame (configurable)

### What Happens When Threat Detected:
1. 🚨 **Alert popup** appears
2. 🔊 **Audio announcement** plays automatically
3. 📝 **Alert text** logged in Activity Log
4. **Alert includes**: Plate number, location, threat type

**Example Alert:**
> "Attention security. Black SUV near Gate 3, plate MH20EE7602. Possible gun detected. Please respond immediately."

### Configure Security Features
Edit `.env` file:
```bash
ENABLE_THREAT_DETECTION=true      # Enable threat detection
THREAT_DETECTION_INTERVAL=5       # Check every Nth frame
THREAT_CONFIDENCE_THRESHOLD=0.25  # Minimum confidence
ENABLE_TTS=true                   # Enable audio alerts
```

---

## 🎮 Controls

| Control | Function |
|---------|----------|
| **Auto Mode** | Continuous automatic detection |
| **Manual Mode** | Click "Detect Plate Now" to trigger |
| **Start Camera** | Begin video feed |
| **Stop Camera** | Stop video feed |
| **Pause Detection** | Temporarily stop detecting |
| **Reset History** | Clear detection records |

---

## 📊 Status Colors

- 🟢 **Green**: Valid booking, within time
- 🔴 **Red**: VIOLATION - No booking
- 🟠 **Orange**: OVERSTAYED - Past booking end
- 🔵 **Blue**: Booking exists, hasn't started

---

## 💡 Pro Tips

1. **Best Camera Setup**: 6-8 feet high, 30-45° angle
2. **Use Auto Mode** for live monitoring
3. **Use Manual Mode** for testing
4. **Check Activity Log** for detailed events
5. **Security alerts** are automatic - no setup needed

---

## ❓ Troubleshooting

**Camera not connecting?**
→ Check URL, ensure camera app is running

**Plates not detecting?**
→ Check lighting, plate visibility, reset history

**Security alerts not working?**
→ Check `.env` config, models load on first use

---

For detailed information, see **USER_GUIDE.md**
