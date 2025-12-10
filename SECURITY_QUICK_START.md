# Security Features - Quick Start Guide

This guide shows you how to use the threat detection and text-to-speech security features.

## Prerequisites

1. **Get a Hugging Face Token:**
   - Go to https://huggingface.co/settings/tokens
   - Click "New token"
   - Copy the token

2. **Add to your `.env.local` file:**
   ```env
   HF_API_TOKEN=your_token_here
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Method 1: Using the API Directly (cURL/Postman)

### Test Threat Detection

```bash
curl -X POST http://localhost:3000/api/security/threat-detection \
  -F "image=@path/to/your/image.jpg"
```

**Response:**
```json
{
  "threats": [
    {
      "label": "gun",
      "score": 0.85,
      "box": { "x": 100, "y": 200, "width": 50, "height": 80 }
    }
  ],
  "hasThreat": true
}
```

### Test Text-to-Speech

```bash
curl -X POST http://localhost:3000/api/security/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Attention security. Threat detected near Gate 3."}'
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

### Test Full Security Alert Pipeline

```bash
curl -X POST http://localhost:3000/api/security/alert \
  -F "image=@path/to/your/image.jpg" \
  -F 'vehicleInfo={"zoneName":"Gate 3","vehicleColor":"black","vehicleType":"SUV","plateNumber":"KA01AB1234"}'
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

## Method 2: Using from JavaScript/TypeScript (Frontend)

### Example: Upload Image and Check for Threats

```typescript
async function checkThreats(imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/api/security/threat-detection', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  
  if (result.hasThreat) {
    alert(`⚠️ Threat detected: ${result.threats.map(t => t.label).join(', ')}`);
  } else {
    console.log('✅ No threats detected');
  }
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    checkThreats(file);
  }
});
```

### Example: Generate and Play Security Alert

```typescript
async function generateSecurityAlert(imageFile: File, zoneName: string, plateNumber: string) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('vehicleInfo', JSON.stringify({
    zoneName: zoneName,
    vehicleColor: 'black',
    vehicleType: 'SUV',
    plateNumber: plateNumber
  }));

  const response = await fetch('/api/security/alert', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  if (result.hasThreat) {
    // Display alert text
    alert(result.alertText);
    
    // Play audio
    if (result.audio.base64) {
      const audio = new Audio(`data:${result.audio.mimeType};base64,${result.audio.base64}`);
      audio.play();
    }
    
    // Log threats
    console.log('Detected threats:', result.threats);
  } else {
    console.log('✅ No threats detected');
  }
}
```

## Method 3: Integrated with Plate Detection

The security pipeline is **automatically integrated** into the existing plate detection endpoint. When you send plate detection requests with images, it will also check for threats.

### Enhanced Plate Detection Request

```typescript
const response = await fetch('/api/plate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_APP_KEY'
  },
  body: JSON.stringify({
    plate: 'KA01AB1234',
    address: 'Gate 3, Parking Area',
    timestamp: new Date().toISOString(),
    // Add these fields for security check:
    imageBase64: imageBase64String,  // Base64-encoded image
    zoneName: 'Gate 3',
    vehicleColor: 'black',
    vehicleType: 'SUV'
  })
});

const result = await response.json();

// Check security alert if present
if (result.securityAlert?.hasThreat) {
  console.log('🚨 SECURITY ALERT:', result.securityAlert.alertText);
  
  // Play alert audio
  if (result.securityAlert.audio.base64) {
    const audio = new Audio(`data:${result.securityAlert.audio.mimeType};base64,${result.securityAlert.audio.base64}`);
    audio.play();
  }
}
```

## Method 4: Using Python Scripts (Standalone)

If you're using the Python ALPR system, you can use the standalone scripts:

### 1. Install Dependencies

```bash
cd Main
pip install -r requirements-security.txt
```

### 2. Test Threat Detection

```python
from security_threat_detection import detect_threats

# Detect threats in an image
threats = detect_threats("path/to/image.jpg", save_results=True)

if threats:
    print(f"⚠️ {len(threats)} threat(s) detected:")
    for threat in threats:
        print(f"  - {threat['label']}: {threat['score']:.2f} confidence")
else:
    print("✅ No threats detected")
```

### 3. Test Full Security Alert

```python
from security_orchestrator import process_security_alert
import base64

# Process security alert
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
    print(f"🚨 ALERT: {result['alertText']}")
    
    # Save audio file
    if result['audio']['base64']:
        audio_bytes = base64.b64decode(result['audio']['base64'])
        with open("security_alert.wav", "wb") as f:
            f.write(audio_bytes)
        print("✅ Audio saved to security_alert.wav")
```

### 4. Command Line Usage

```bash
# Threat detection only
python Main/security_threat_detection.py path/to/image.jpg

# Full security alert
python Main/security_orchestrator.py path/to/image.jpg "Gate 3" "black" "SUV" "KA01AB1234"

# Text-to-speech test
python Main/security_text_to_speech.py "Attention security. Threat detected."
```

## Method 5: Simple Test Page (Quick Demo)

Create a simple HTML file to test:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Security Test</title>
</head>
<body>
    <h1>Security Threat Detection Test</h1>
    
    <input type="file" id="imageInput" accept="image/*">
    <button onclick="testSecurity()">Check for Threats</button>
    
    <div id="result"></div>
    <audio id="alertAudio" controls></audio>
    
    <script>
        async function testSecurity() {
            const fileInput = document.getElementById('imageInput');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select an image');
                return;
            }
            
            const formData = new FormData();
            formData.append('image', file);
            formData.append('vehicleInfo', JSON.stringify({
                zoneName: 'Gate 3',
                vehicleColor: 'black',
                vehicleType: 'SUV',
                plateNumber: 'KA01AB1234'
            }));
            
            try {
                const response = await fetch('http://localhost:3000/api/security/alert', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                const resultDiv = document.getElementById('result');
                
                if (result.hasThreat) {
                    resultDiv.innerHTML = `
                        <h2>🚨 Security Alert</h2>
                        <p><strong>Alert:</strong> ${result.alertText}</p>
                        <p><strong>Threats:</strong> ${result.threats.map(t => t.label).join(', ')}</p>
                    `;
                    
                    if (result.audio.base64) {
                        const audio = document.getElementById('alertAudio');
                        audio.src = `data:${result.audio.mimeType};base64,${result.audio.base64}`;
                        audio.play();
                    }
                } else {
                    resultDiv.innerHTML = '<p>✅ No threats detected</p>';
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error: ' + error.message);
            }
        }
    </script>
</body>
</html>
```

Save this as `test-security.html` and open it in your browser (make sure your dev server is running).

## Troubleshooting

### "HF_API_TOKEN not set" Warning
- Make sure you've added `HF_API_TOKEN=your_token` to `.env.local`
- Restart your dev server after adding the token

### "Model is loading" (503 Error)
- Hugging Face models take time to load on first use
- Wait 30-60 seconds and try again
- The model stays loaded for subsequent requests

### No Threats Detected (False Negatives)
- Make sure the image quality is good
- Ensure weapons are clearly visible in the image
- Try adjusting the confidence threshold (currently 0.3)

### Audio Not Playing
- Check browser console for errors
- Ensure audio codec is supported (WAV should work everywhere)
- Try downloading the base64 audio and playing it manually

## Next Steps

1. **Integrate into your ALPR system**: Add security checks when processing camera frames
2. **Add notifications**: Send alerts via email/SMS/webhook when threats are detected
3. **Log security events**: Store threat detections in your database
4. **Dashboard**: Create an admin dashboard to view security alerts

## Example Integration with Existing ALPR Flow

If you're already sending plate detections, just add the image:

```typescript
// Your existing plate detection code
const plateDetection = {
  plate: detectedPlate,
  address: location,
  timestamp: new Date().toISOString(),
  imageBase64: imageBase64  // Add this!
};

const response = await fetch('/api/plate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${APP_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(plateDetection)
});

const result = await response.json();

// Check for security alerts
if (result.securityAlert?.hasThreat) {
  // Handle security alert
  handleSecurityAlert(result.securityAlert);
}
```








