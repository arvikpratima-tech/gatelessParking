# Security Features Documentation

This document describes the weapon/threat detection and text-to-speech security alert system integrated into the Gateless Parking application.

## Overview

The security pipeline provides:
1. **Threat Detection**: Detects weapons (guns, knives, etc.) in images using YOLOv8
2. **Text-to-Speech**: Converts security alerts to audio announcements
3. **Alert Orchestration**: Combines threat detection with vehicle info to generate actionable alerts

## Models Used

- **Threat Detection**: `Subh775/Threat-Detection-YOLOv8n` (YOLOv8)
- **Text-to-Speech**: `ai4bharat/indic-parler-tts` (Indian English TTS)

## Environment Variables

Add these to your `.env.local` file:

```env
# Hugging Face API Token (required for both services)
HF_API_TOKEN=your_huggingface_token_here

# Optional: Override model IDs (defaults shown below)
THREAT_DETECTION_MODEL=Subh775/Threat-Detection-YOLOv8n
TTS_MODEL=ai4bharat/indic-parler-tts
```

### Getting a Hugging Face Token

1. Go to https://huggingface.co/settings/tokens
2. Create a new access token
3. Copy the token to your `.env.local` file

## API Endpoints

### 1. Threat Detection

**POST** `/api/security/threat-detection`

Detects weapons/threats in an image.

**Request (FormData):**
- `image` (File): Image file
- OR `imageUrl` (string): URL to image
- OR `imageBase64` (string): Base64-encoded image

**Response:**
```json
{
  "threats": [
    {
      "label": "gun",
      "score": 0.85,
      "box": {
        "x": 100,
        "y": 200,
        "width": 50,
        "height": 80
      }
    }
  ],
  "hasThreat": true
}
```

### 2. Text-to-Speech

**POST** `/api/security/text-to-speech`

Converts text to speech audio.

**Request (JSON):**
```json
{
  "text": "Attention security. Threat detected."
}
```

**Response:**
```json
{
  "success": true,
  "audio": {
    "base64": "UklGRiQAAABXQVZFZm10...",
    "mimeType": "audio/wav"
  }
}
```

### 3. Security Alert (Full Pipeline)

**POST** `/api/security/alert`

Complete security alert pipeline: detects threats and generates alert speech.

**Request (FormData):**
- `image` / `imageUrl` / `imageBase64`: Image to analyze
- `vehicleInfo` (JSON string): Vehicle and location info

**vehicleInfo example:**
```json
{
  "zoneName": "Gate 3",
  "vehicleColor": "black",
  "vehicleType": "SUV",
  "plateNumber": "KA01AB1234"
}
```

**Response:**
```json
{
  "hasThreat": true,
  "threats": [...],
  "alertText": "Attention security. Black SUV near Gate 3, plate KA01AB1234. Possible handgun detected. Please respond immediately.",
  "audio": {
    "base64": "UklGRiQAAABXQVZFZm10...",
    "mimeType": "audio/wav"
  }
}
```

## Integration with Plate Detection

The security pipeline is automatically integrated into the plate detection endpoint (`/api/plate`). When an image is provided along with plate detection, it will also run threat detection.

**Enhanced Plate Detection Request:**
```json
{
  "plate": "KA01AB1234",
  "address": "Gate 3",
  "timestamp": "2024-01-15T10:30:00",
  "imageBase64": "base64_encoded_image",
  "zoneName": "Gate 3",
  "vehicleColor": "black",
  "vehicleType": "SUV"
}
```

The response will include a `securityAlert` field if image was provided:
```json
{
  "message": "ok",
  "hasBooking": true,
  "booking": {...},
  "securityAlert": {
    "hasThreat": false,
    "threats": [],
    ...
  }
}
```

## Python Standalone Scripts

For standalone Python usage (e.g., with ALPR system), see scripts in the `Main/` folder:

### Installation

```bash
pip install -r Main/requirements-security.txt
```

### Usage

**Threat Detection:**
```python
from security_threat_detection import detect_threats

threats = detect_threats("path/to/image.jpg", save_results=True)
print(f"Detected {len(threats)} threats")
```

**Text-to-Speech:**
```python
from security_text_to_speech import synthesize_alert_speech_base64

result = synthesize_alert_speech_base64("Attention security. Threat detected.")
audio_bytes = base64.b64decode(result['base64'])
with open("alert.wav", "wb") as f:
    f.write(audio_bytes)
```

**Full Orchestration:**
```python
from security_orchestrator import process_security_alert

result = process_security_alert(
    "path/to/image.jpg",
    {
        "zoneName": "Gate 3",
        "vehicleColor": "black",
        "vehicleType": "SUV",
        "plateNumber": "KA01AB1234"
    }
)

if result['hasThreat']:
    print(f"Alert: {result['alertText']}")
    # Save audio
    audio_bytes = base64.b64decode(result['audio']['base64'])
    with open("alert.wav", "wb") as f:
        f.write(audio_bytes)
```

## Frontend Usage

To play the generated audio in the browser:

```typescript
const response = await fetch('/api/security/alert', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (result.hasThreat && result.audio.base64) {
  // Create audio element
  const audio = new Audio(`data:${result.audio.mimeType};base64,${result.audio.base64}`);
  audio.play();
  
  // Or display alert text
  alert(result.alertText);
}
```

## Error Handling

- If `HF_API_TOKEN` is not set, services will log warnings and return empty results
- If models are loading (503 error), retry after a few seconds
- Threat detection failures are non-fatal and won't break plate detection
- TTS failures will still return alert text (without audio)

## Testing

**Test Threat Detection:**
```bash
curl -X POST http://localhost:3000/api/security/threat-detection \
  -F "image=@test_image.jpg"
```

**Test Full Pipeline:**
```bash
curl -X POST http://localhost:3000/api/security/alert \
  -F "image=@test_image.jpg" \
  -F 'vehicleInfo={"zoneName":"Gate 3","vehicleColor":"black","vehicleType":"SUV"}'
```

## Notes

- Models are loaded on-demand and cached
- First request may be slower if models need to load
- Hugging Face Inference API may have rate limits depending on your plan
- For production, consider running models locally or using dedicated inference servers








