import { detectThreats } from './threat-detection';
import { synthesizeAlertSpeechBase64 } from './text-to-speech';
import { DetectedThreat, SecurityAlertResponse, VehicleInfo } from './types';

/**
 * Builds a natural-language alert sentence from threat and vehicle information
 */
function buildAlertText(
  threats: DetectedThreat[],
  vehicleInfo: VehicleInfo
): string {
  const parts: string[] = [];
  
  // Start with attention call
  parts.push('Attention security.');
  
  // Add vehicle description
  const vehicleDesc: string[] = [];
  if (vehicleInfo.vehicleColor) {
    vehicleDesc.push(vehicleInfo.vehicleColor);
  }
  if (vehicleInfo.vehicleType) {
    vehicleDesc.push(vehicleInfo.vehicleType);
  } else if (vehicleDesc.length > 0) {
    vehicleDesc.push('vehicle');
  }
  
  if (vehicleDesc.length > 0 || vehicleInfo.plateNumber) {
    const vehicleStr = vehicleDesc.length > 0 
      ? vehicleDesc.join(' ')
      : 'vehicle';
    
    if (vehicleInfo.plateNumber) {
      parts.push(`${vehicleStr} near ${vehicleInfo.zoneName}, plate ${vehicleInfo.plateNumber}.`);
    } else {
      parts.push(`${vehicleStr} near ${vehicleInfo.zoneName}.`);
    }
  } else {
    parts.push(`Activity detected near ${vehicleInfo.zoneName}.`);
  }
  
  // Add threat information
  const threatLabels = threats.map(t => t.label.toLowerCase());
  const uniqueThreats = [...new Set(threatLabels)];
  
  if (uniqueThreats.length === 1) {
    parts.push(`Possible ${uniqueThreats[0]} detected.`);
  } else if (uniqueThreats.length > 1) {
    const lastThreat = uniqueThreats.pop();
    parts.push(`Possible ${uniqueThreats.join(', ')} and ${lastThreat} detected.`);
  }
  
  // Add urgency
  parts.push('Please respond immediately.');
  
  return parts.join(' ');
}

/**
 * Main orchestration function for security alert pipeline
 * @param imageData - Image as base64 string, Buffer, or URL
 * @param imageFormat - Format of image data
 * @param vehicleInfo - Vehicle and location information
 * @returns Security alert response with threats, alert text, and audio
 */
export async function processSecurityAlert(
  imageData: string | Buffer,
  imageFormat: 'base64' | 'bytes' | 'url' = 'base64',
  vehicleInfo: VehicleInfo
): Promise<SecurityAlertResponse> {
  try {
    // Step 1: Run threat detection
    const detectionResult = await detectThreats(imageData, imageFormat);
    
    // Step 2: If no threats, return early
    if (!detectionResult.hasThreat) {
      return {
        hasThreat: false,
        threats: [],
        alertText: '',
        audio: {
          base64: '',
          mimeType: 'audio/wav',
        },
      };
    }
    
    // Step 3: Build alert text
    const alertText = buildAlertText(detectionResult.threats, vehicleInfo);
    
    // Step 4: Generate speech
    const audioResult = await synthesizeAlertSpeechBase64(alertText);
    
    if (!audioResult) {
      // If TTS fails, still return the alert text
      console.warn('TTS failed, but threat detected. Alert text available.');
      return {
        hasThreat: true,
        threats: detectionResult.threats,
        alertText,
        audio: {
          base64: '',
          mimeType: 'audio/wav',
        },
      };
    }
    
    // Step 5: Return complete response
    return {
      hasThreat: true,
      threats: detectionResult.threats,
      alertText,
      audio: audioResult,
    };
  } catch (error) {
    console.error('Error in security alert orchestration:', error);
    // Return safe fallback
    return {
      hasThreat: false,
      threats: [],
      alertText: '',
      audio: {
        base64: '',
        mimeType: 'audio/wav',
      },
    };
  }
}








