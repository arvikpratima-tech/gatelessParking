import { DetectedThreat, ThreatDetectionResponse } from './types';

const THREAT_MODEL_ID = process.env.THREAT_DETECTION_MODEL || "Subh775/Threat-Detection-YOLOv8n";
const HF_API_TOKEN = process.env.HF_API_TOKEN;

// Threat class labels to filter for (YOLO threat detection model outputs)
const THREAT_LABELS = ['gun', 'handgun', 'pistol', 'rifle', 'knife', 'weapon', 'firearm'];

/**
 * Detects threats (weapons) in an image using Hugging Face Inference API
 * @param imageData - Image as base64 string, file bytes (Buffer), or URL
 * @param imageFormat - Format of the image data: 'base64', 'bytes', or 'url'
 * @returns List of detected threats
 */
export async function detectThreats(
  imageData: string | Buffer,
  imageFormat: 'base64' | 'bytes' | 'url' = 'base64'
): Promise<ThreatDetectionResponse> {
  try {
    if (!HF_API_TOKEN) {
      console.warn('HF_API_TOKEN not set. Threat detection will not work. Please set HF_API_TOKEN environment variable.');
      return { threats: [], hasThreat: false };
    }

    // Prepare image data for HF API
    let imageInput: string;
    if (imageFormat === 'url') {
      imageInput = imageData as string;
    } else if (imageFormat === 'base64') {
      // Remove data URL prefix if present
      const base64 = (imageData as string).replace(/^data:image\/\w+;base64,/, '');
      imageInput = base64;
    } else {
      // Convert Buffer to base64
      imageInput = (imageData as Buffer).toString('base64');
    }

    // Call Hugging Face Inference API
    // For object detection models, send image as base64 in JSON or binary
    let requestBody: string | Buffer;
    let contentType: string;

    if (imageFormat === 'url') {
      requestBody = JSON.stringify({ inputs: imageInput });
      contentType = 'application/json';
    } else {
      // For base64 or bytes, send as binary or base64 string in JSON
      const base64Data = imageFormat === 'base64' 
        ? imageInput as string
        : (imageInput as Buffer).toString('base64');
      requestBody = JSON.stringify({ inputs: base64Data });
      contentType = 'application/json';
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${THREAT_MODEL_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': contentType,
        },
        body: requestBody,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Threat detection API error:', response.status, errorText);
      
      // If model is still loading, return empty result
      if (response.status === 503) {
        console.warn('Threat detection model is loading. Please try again in a few moments.');
        return { threats: [], hasThreat: false };
      }
      
      throw new Error(`Threat detection failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    // Parse YOLO detection results
    // HF API for object detection returns: [{label, score, box: {xmin, ymin, xmax, ymax}}]
    const detections = Array.isArray(result) ? result : (result.predictions || result);

    const threats: DetectedThreat[] = detections
      .filter((detection: any) => {
        const label = (detection.label || detection.class || '').toLowerCase();
        // Filter for threat-related labels
        return THREAT_LABELS.some(threatLabel => label.includes(threatLabel)) && 
               (detection.score || detection.confidence || 0) > 0.3; // Minimum confidence threshold
      })
      .map((detection: any) => {
        const box = detection.box || detection.bbox || {};
        return {
          label: detection.label || detection.class || 'unknown',
          score: detection.score || detection.confidence || 0,
          box: {
            x: box.xmin || box.x || 0,
            y: box.ymin || box.y || 0,
            width: (box.xmax || (box.x + box.width) || 0) - (box.xmin || box.x || 0),
            height: (box.ymax || (box.y + box.height) || 0) - (box.ymin || box.y || 0),
          },
        };
      });

    return {
      threats,
      hasThreat: threats.length > 0,
    };
  } catch (error) {
    console.error('Error in threat detection:', error);
    // Return empty result on error, don't crash
    return { threats: [], hasThreat: false };
  }
}

