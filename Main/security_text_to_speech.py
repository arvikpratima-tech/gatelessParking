"""
Text-to-Speech Service using ai4bharat/indic-parler-tts
"""
import os
from typing import Optional, Tuple
from transformers import pipeline

# Model configuration
TTS_MODEL_ID = os.getenv("TTS_MODEL", "ai4bharat/indic-parler-tts")

# Global pipeline cache
_tts_pipeline_cache = None


def get_tts_pipeline():
    """Get or load the TTS pipeline (cached)"""
    global _tts_pipeline_cache
    if _tts_pipeline_cache is None:
        print(f"Loading TTS model: {TTS_MODEL_ID}")
        try:
            _tts_pipeline_cache = pipeline(
                "text-to-speech",
                model=TTS_MODEL_ID
            )
            print("TTS model loaded successfully")
        except Exception as e:
            print(f"Error loading TTS model: {e}")
            raise
    return _tts_pipeline_cache


def synthesize_alert_speech(text: str) -> Optional[Tuple[bytes, str]]:
    """
    Synthesize speech from text
    
    Args:
        text: The alert message to convert to speech
    
    Returns:
        Tuple of (audio_bytes, mime_type) or None on error
    """
    try:
        pipe = get_tts_pipeline()
        
        # Generate speech
        output = pipe(text)
        
        # Handle different output formats
        if isinstance(output, dict):
            audio_array = output.get("audio", output.get("array"))
            sampling_rate = output.get("sampling_rate", 22050)
        elif isinstance(output, list) and len(output) > 0:
            audio_array = output[0].get("audio", output[0].get("array"))
            sampling_rate = output[0].get("sampling_rate", 22050)
        else:
            audio_array = output
            sampling_rate = 22050
        
        if audio_array is None:
            print("Warning: TTS output format not recognized")
            return None
        
        # Convert numpy array to bytes (WAV format)
        import numpy as np
        import io
        import soundfile as sf
        
        # Ensure audio is in correct format
        if not isinstance(audio_array, np.ndarray):
            audio_array = np.array(audio_array)
        
        # Normalize audio
        if audio_array.dtype != np.float32:
            if audio_array.dtype == np.int16:
                audio_array = audio_array.astype(np.float32) / 32768.0
            else:
                audio_array = audio_array.astype(np.float32)
        
        # Write to WAV format in memory
        buffer = io.BytesIO()
        sf.write(buffer, audio_array, sampling_rate, format='WAV')
        audio_bytes = buffer.getvalue()
        
        return audio_bytes, "audio/wav"
    
    except Exception as e:
        print(f"Error in TTS synthesis: {e}")
        return None


def synthesize_alert_speech_base64(text: str) -> Optional[dict]:
    """
    Synthesize speech and return as base64-encoded string
    
    Args:
        text: The alert message
    
    Returns:
        Dict with 'base64' and 'mimeType' keys, or None on error
    """
    result = synthesize_alert_speech(text)
    if result is None:
        return None
    
    audio_bytes, mime_type = result
    import base64
    
    return {
        "base64": base64.b64encode(audio_bytes).decode('utf-8'),
        "mimeType": mime_type
    }


if __name__ == "__main__":
    # Test TTS
    import sys
    
    test_text = sys.argv[1] if len(sys.argv) > 1 else "Attention security. Threat detected. Please respond immediately."
    
    print(f"Testing TTS with text: '{test_text}'")
    result = synthesize_alert_speech_base64(test_text)
    
    if result:
        print(f"\n✅ Audio generated: {len(result['base64'])} bytes (base64)")
        print(f"   MIME type: {result['mimeType']}")
        
        # Optionally save to file
        import base64
        audio_bytes = base64.b64decode(result['base64'])
        with open("test_output.wav", "wb") as f:
            f.write(audio_bytes)
        print(f"   Saved to: test_output.wav")
    else:
        print("\n❌ TTS failed")








