import { DetectedFire, FireDetectionResponse } from './types';

const FIRE_MODEL_ID = process.env.FIRE_DETECTION_MODEL || "Subh775/Fire-Detection-YOLOv8n";
const HF_API_TOKEN = process.env.HF_API_TOKEN;

// Fire-related class labels to filter for (YOLO fire detection model outputs)
const FIRE_LABELS = ['fire', 'flame', 'smoke', 'burning', 'blaze', 'flames'];

/**
 * Detects fire in an image using Hugging Face Inference API
 * @param imageData - Image as base64 string, file bytes (Buffer), or URL
 * @param imageFormat - Format of the image data: 'base64', 'bytes', or 'url'
 * @returns List of detected fire instances
 */
export async function detectFire(
  imageData: string | Buffer,
  imageFormat: 'base64' | 'bytes' | 'url' = 'base64'
): Promise<FireDetectionResponse> {
  try {
    if (!HF_API_TOKEN) {
      console.warn('HF_API_TOKEN not set. Fire detection will not work. Please set HF_API_TOKEN environment variable.');
      return { fires: [], hasFire: false };
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

    console.log(`[FIRE DETECTION] Calling Hugging Face API with model: ${FIRE_MODEL_ID}`);
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${FIRE_MODEL_ID}`,
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
      console.error('[FIRE DETECTION] API error:', response.status, errorText);
      
      // If model is still loading, return empty result
      if (response.status === 503) {
        console.warn('[FIRE DETECTION] Model is loading. Please try again in a few moments.');
        return { fires: [], hasFire: false };
      }
      
      // Log the error but don't throw - return empty result
      console.error(`[FIRE DETECTION] Failed: ${response.status} ${errorText}`);
      return { fires: [], hasFire: false };
    }

    const result = await response.json();
    console.log('[FIRE DETECTION] Raw API response type:', typeof result);
    console.log('[FIRE DETECTION] Raw API response (first 500 chars):', JSON.stringify(result).substring(0, 500));
    
    // Log full response structure for debugging
    if (Array.isArray(result)) {
      console.log(`[FIRE DETECTION] Response is array with ${result.length} items`);
    } else if (typeof result === 'object') {
      console.log('[FIRE DETECTION] Response keys:', Object.keys(result));
    }

    // Parse YOLO detection results
    // HF API for object detection can return different formats
    let detections: any[] = [];
    
    if (Array.isArray(result)) {
      detections = result;
    } else if (result.predictions) {
      detections = Array.isArray(result.predictions) ? result.predictions : [result.predictions];
    } else if (result.results) {
      detections = Array.isArray(result.results) ? result.results : [result.results];
    } else if (result.boxes || result.labels) {
      // YOLO format with separate boxes and labels
      const boxes = result.boxes || [];
      const labels = result.labels || [];
      const scores = result.scores || [];
      detections = boxes.map((box: any, i: number) => ({
        label: labels[i] || 'fire',
        score: scores[i] || 0.5,
        box: box
      }));
    } else {
      // Try to extract from any other format
      detections = [result];
    }

    console.log(`[FIRE DETECTION] Found ${detections.length} raw detections`);

    const fires: DetectedFire[] = detections
      .filter((detection: any) => {
        const label = (detection.label || detection.class || detection.name || '').toLowerCase();
        const score = detection.score || detection.confidence || detection.probability || 0;
        
        // Lower confidence threshold for fire detection (0.2 instead of 0.3)
        const passesThreshold = score > 0.2;
        
        // Check if label matches fire-related terms
        const isFireLabel = FIRE_LABELS.some(fireLabel => label.includes(fireLabel));
        
        // Also accept if score is high even without matching label (in case model uses different labels)
        const highConfidence = score > 0.7;
        
        const isFire = (isFireLabel || highConfidence) && passesThreshold;
        
        if (isFire) {
          console.log(`[FIRE DETECTION] ✓ Detected fire: ${label} (confidence: ${score.toFixed(2)})`);
        }
        
        return isFire;
      })
      .map((detection: any) => {
        const box = detection.box || detection.bbox || detection.bounding_box || {};
        const label = detection.label || detection.class || detection.name || 'fire';
        const score = detection.score || detection.confidence || detection.probability || 0;
        
        return {
          label: label,
          score: score,
          box: {
            x: box.xmin || box.x || box.x1 || box.left || 0,
            y: box.ymin || box.y || box.y1 || box.top || 0,
            width: (box.xmax || box.x2 || box.right || (box.x + box.width) || 0) - (box.xmin || box.x || box.x1 || box.left || 0),
            height: (box.ymax || box.y2 || box.bottom || (box.y + box.height) || 0) - (box.ymin || box.y || box.y1 || box.top || 0),
          },
        };
      });

    console.log(`[FIRE DETECTION] Final result: ${fires.length} fire(s) detected`);

    return {
      fires,
      hasFire: fires.length > 0,
    };
  } catch (error) {
    console.error('Error in fire detection:', error);
    // Return empty result on error, don't crash
    return { fires: [], hasFire: false };
  }
}

