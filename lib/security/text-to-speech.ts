import { SecurityAlertResponse } from './types';

const TTS_MODEL_ID = process.env.TTS_MODEL || "ai4bharat/indic-parler-tts";
const HF_API_TOKEN = process.env.HF_API_TOKEN;

/**
 * Synthesizes speech from text using Hugging Face Inference API
 * @param text - The alert message to convert to speech
 * @returns Audio bytes and MIME type
 */
export async function synthesizeAlertSpeech(
  text: string
): Promise<{ audioBytes: Buffer; mimeType: string } | null> {
  try {
    if (!HF_API_TOKEN) {
      console.warn('HF_API_TOKEN not set. TTS will not work. Please set HF_API_TOKEN environment variable.');
      return null;
    }

    // Call Hugging Face Inference API for TTS
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${TTS_MODEL_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API error:', response.status, errorText);
      
      // If model is still loading
      if (response.status === 503) {
        console.warn('TTS model is loading. Please try again in a few moments.');
        return null;
      }
      
      throw new Error(`TTS failed: ${response.status} ${errorText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type') || 'audio/wav';
    const mimeType = contentType.includes('audio/') ? contentType : 'audio/wav';

    // Get audio as array buffer
    const arrayBuffer = await response.arrayBuffer();
    const audioBytes = Buffer.from(arrayBuffer);

    return { audioBytes, mimeType };
  } catch (error) {
    console.error('Error in TTS synthesis:', error);
    return null;
  }
}

/**
 * Synthesizes speech and returns base64-encoded audio
 * @param text - The alert message
 * @returns Base64-encoded audio and MIME type, or null on error
 */
export async function synthesizeAlertSpeechBase64(
  text: string
): Promise<{ base64: string; mimeType: string } | null> {
  const result = await synthesizeAlertSpeech(text);
  
  if (!result) {
    return null;
  }

  return {
    base64: result.audioBytes.toString('base64'),
    mimeType: result.mimeType,
  };
}








