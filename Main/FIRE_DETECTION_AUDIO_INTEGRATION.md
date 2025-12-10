# Fire Detection Audio Integration Guide

## Overview
This guide explains how to integrate fire detection audio alerts into the Python ALPR system.

## Audio File Setup

1. **Place the MP3 file** in one of these locations:
   - `Main/as-ma-ka-bhosada-aag.mp3` (recommended)
   - `public/as-ma-ka-bhosada-aag.mp3`
   - Current working directory

2. **File Requirements**:
   - Format: MP3
   - Name: `as-ma-ka-bhosada-aag.mp3` (or set `FIRE_AUDIO_FILE` env variable)

## Installation

Install required dependency:
```bash
pip install pygame
```

Or install all security requirements:
```bash
pip install -r Main/requirements-security.txt
```

## Usage in ALPR System

### Basic Integration

```python
from security_fire_audio import play_fire_alert, stop_fire_alert, is_playing

# When fire is detected (from API response or local detection):
if fire_detected:
    play_fire_alert()  # Starts playing in loop

# To stop manually:
stop_fire_alert()

# Check if playing:
if is_playing():
    print("Fire alert audio is currently playing")
```

### Integration with API Response

When your ALPR system receives a response from `/api/plate` that includes fire detection:

```python
import requests
from security_fire_audio import play_fire_alert, stop_fire_alert

# After sending plate detection to API
response = requests.post(api_url, json=plate_data)
result = response.json()

# Check for fire detection
if result.get('fireAlert') and result['fireAlert'].get('hasFire'):
    print("🔥 FIRE DETECTED!")
    play_fire_alert()  # Play audio alert
else:
    # Stop if no fire (optional)
    stop_fire_alert()
```

### Integration with Local Fire Detection

If you're doing local fire detection in Python:

```python
from security_fire_detection import detect_fire  # You'll need to create this
from security_fire_audio import play_fire_alert, stop_fire_alert

# Detect fire in image
fires = detect_fire(image_path)

if fires and len(fires) > 0:
    print(f"🔥 {len(fires)} fire(s) detected!")
    play_fire_alert()
else:
    stop_fire_alert()
```

## Configuration

Set environment variables (in `.env` file or system):

```env
# Audio file name (default: as-ma-ka-bhosada-aag.mp3)
FIRE_AUDIO_FILE=as-ma-ka-bhosada-aag.mp3

# Audio volume (0.0 to 1.0, default: 1.0)
FIRE_AUDIO_VOLUME=1.0

# Auto-stop after N minutes (default: 5)
FIRE_AUDIO_AUTO_STOP_MINUTES=5
```

## Features

- ✅ **Automatic Loop**: Audio plays continuously until stopped
- ✅ **Background Thread**: Doesn't block main application
- ✅ **Auto-Stop**: Automatically stops after configured minutes (default: 5)
- ✅ **Manual Stop**: Can be stopped programmatically
- ✅ **Volume Control**: Configurable volume level
- ✅ **Multiple File Locations**: Automatically searches for audio file

## Example Integration in Main ALPR App

```python
# In your main.py or ALPR application:

from security_fire_audio import play_fire_alert, stop_fire_alert

class ALPRWindow:
    def __init__(self):
        # ... existing code ...
        self.fire_alert_playing = False
    
    def process_plate_detection(self, plate_data):
        # Send to API
        response = self.send_to_api(plate_data)
        
        # Check for fire
        if response.get('fireAlert', {}).get('hasFire'):
            if not self.fire_alert_playing:
                play_fire_alert()
                self.fire_alert_playing = True
                # Show alert in GUI
                self.show_fire_alert(response['fireAlert'])
        else:
            if self.fire_alert_playing:
                stop_fire_alert()
                self.fire_alert_playing = False
    
    def show_fire_alert(self, fire_data):
        # Display fire alert in GUI
        fires = fire_data.get('fires', [])
        alert_text = f"🔥 FIRE DETECTED: {len(fires)} fire instance(s)"
        # Update GUI with alert
        self.log_activity(alert_text)
```

## Troubleshooting

1. **Audio not playing**:
   - Check that pygame is installed: `pip install pygame`
   - Verify audio file exists in one of the search locations
   - Check console for error messages

2. **Audio file not found**:
   - Ensure file is named correctly: `as-ma-ka-bhosada-aag.mp3`
   - Place in `Main/` directory
   - Or set `FIRE_AUDIO_FILE` environment variable

3. **Audio stops immediately**:
   - Check pygame initialization
   - Verify audio file format (must be MP3)
   - Check volume setting

4. **Multiple instances playing**:
   - The module prevents multiple instances automatically
   - Call `stop_fire_alert()` before starting new playback

## Notes

- Audio plays in a separate thread, so it won't block the main application
- Auto-stop prevents infinite playback (default: 5 minutes)
- The module automatically searches for the audio file in multiple locations
- Volume can be adjusted via environment variable



