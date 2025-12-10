"""
Threat Detection Service using YOLOv8
Uses Subh775/Threat-Detection-YOLOv8n model via Ultralytics
"""
import os
from typing import List, Dict, Optional, Tuple
from ultralytics import YOLO
import cv2
import numpy as np
from pathlib import Path

# Model configuration
THREAT_MODEL_ID = os.getenv("THREAT_DETECTION_MODEL", "Subh775/Threat-Detection-YOLOv8n")
THREAT_LABELS = ['gun', 'handgun', 'pistol', 'rifle', 'knife', 'weapon', 'firearm']

# Global model cache
_model_cache: Optional[YOLO] = None


def get_threat_model() -> YOLO:
    """Get or load the threat detection model (cached)"""
    global _model_cache
    if _model_cache is None:
        print(f"Loading threat detection model: {THREAT_MODEL_ID}")
        try:
            _model_cache = YOLO.from_pretrained(THREAT_MODEL_ID)
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise
    return _model_cache


def detect_threats(
    image_source: str,
    confidence_threshold: float = 0.3,
    save_results: bool = False
) -> List[Dict]:
    """
    Detect threats in an image
    
    Args:
        image_source: Path to image file or URL
        confidence_threshold: Minimum confidence score (0-1)
        save_results: Whether to save annotated results
    
    Returns:
        List of detected threats with label, score, and bounding box
    """
    try:
        model = get_threat_model()
        
        # Run prediction
        results = model.predict(
            source=image_source,
            conf=confidence_threshold,
            save=save_results
        )
        
        detections = []
        
        # Parse results
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    label_id = int(box.cls[0])
                    label = model.names[label_id].lower()
                    confidence = float(box.conf[0])
                    
                    # Filter for threat labels
                    if any(threat_label in label for threat_label in THREAT_LABELS):
                        xyxy = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = xyxy
                        
                        detections.append({
                            "label": model.names[label_id],
                            "score": confidence,
                            "box": {
                                "x": float(x1),
                                "y": float(y1),
                                "width": float(x2 - x1),
                                "height": float(y2 - y1),
                            }
                        })
        
        return detections
    
    except Exception as e:
        print(f"Error in threat detection: {e}")
        return []


def detect_threats_from_bytes(image_bytes: bytes) -> List[Dict]:
    """
    Detect threats from image bytes
    
    Args:
        image_bytes: Image file bytes
    
    Returns:
        List of detected threats
    """
    import tempfile
    import io
    from PIL import Image
    
    try:
        # Convert bytes to numpy array
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            cv2.imwrite(tmp.name, image_np)
            temp_path = tmp.name
        
        try:
            detections = detect_threats(temp_path, save_results=False)
            return detections
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        print(f"Error processing image bytes: {e}")
        return []


if __name__ == "__main__":
    # Test with sample image
    import sys
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"Testing threat detection on: {image_path}")
        threats = detect_threats(image_path, save_results=True)
        
        if threats:
            print(f"\n⚠️  {len(threats)} threat(s) detected:")
            for threat in threats:
                print(f"  - {threat['label']}: {threat['score']:.2f} confidence")
        else:
            print("\n✅ No threats detected")
    else:
        print("Usage: python security_threat_detection.py <image_path>")


