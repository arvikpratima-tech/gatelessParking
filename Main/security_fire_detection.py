"""
Fire Detection Service using YOLOv8
Uses local .pt model file for fire detection (same as threat detection)
"""
import os
from typing import List, Dict, Optional
from ultralytics import YOLO
import cv2
import numpy as np
from pathlib import Path

# Model configuration - uses local .pt file
# Place your fire detection model file (e.g., model.pt) in Main/ or Main/.venv/ directory
FIRE_MODEL_PATH = os.getenv("FIRE_MODEL_PATH", "model.pt")  # Default: model.pt
FIRE_LABELS = ['fire', 'flame', 'smoke', 'burning', 'blaze', 'flames']

# Check if this is a fire detection model based on filename
# Accept if filename contains fire-related terms OR if it's just named "model.pt" (assume it's a fire model)
IS_FIRE_MODEL = any(fire_term in FIRE_MODEL_PATH.lower() for fire_term in ['fire', 'flame', 'smoke', 'burn']) or FIRE_MODEL_PATH.lower() in ['model.pt', 'best.pt', 'weights.pt']
print(f"[FIRE DETECTION INIT] Model path: {FIRE_MODEL_PATH}")
print(f"[FIRE DETECTION INIT] Is fire detection model: {IS_FIRE_MODEL}")

# Global model cache
_fire_model_cache: Optional[YOLO] = None


def get_fire_model() -> YOLO:
    """Get or load the fire detection model (cached) - same pattern as threat detection"""
    global _fire_model_cache
    if _fire_model_cache is None:
        # Try multiple locations for the model file
        script_dir = os.path.dirname(__file__)  # Main/ directory
        current_dir = os.getcwd()
        
        # Build absolute paths to check
        possible_paths = [
            # Check in Main/ directory
            os.path.join(script_dir, FIRE_MODEL_PATH),
            # Check in Main/.venv/ directory
            os.path.join(script_dir, ".venv", FIRE_MODEL_PATH),
            os.path.join(os.path.dirname(script_dir), ".venv", FIRE_MODEL_PATH),
            # Check in current working directory
            os.path.join(current_dir, FIRE_MODEL_PATH),
            # Check in current_dir/.venv/
            os.path.join(current_dir, ".venv", FIRE_MODEL_PATH),
            # Check as absolute path if provided
            FIRE_MODEL_PATH if os.path.isabs(FIRE_MODEL_PATH) else None,
            # Fallback to yolov8n.pt in same locations
            os.path.join(script_dir, "yolov8n.pt"),
            os.path.join(script_dir, ".venv", "yolov8n.pt"),
            os.path.join(current_dir, "yolov8n.pt"),
            os.path.join(current_dir, ".venv", "yolov8n.pt"),
            "yolov8n.pt",  # Default fallback
        ]
        
        # Remove None values
        possible_paths = [p for p in possible_paths if p is not None]
        
        model_path = None
        for path in possible_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                model_path = abs_path
                print(f"[FIRE DETECTION] Found model at: {model_path}")
                break
        
        if not model_path:
            print(f"[FIRE DETECTION] [WARNING] Fire detection model not found. Tried: {possible_paths}")
            print(f"[FIRE DETECTION] Looking for: {FIRE_MODEL_PATH}")
            print(f"[FIRE DETECTION] Using default yolov8n.pt (may not detect fire well)")
            model_path = "yolov8n.pt"
        
            print(f"[FIRE DETECTION] Loading fire detection model: {model_path}")
        try:
            _fire_model_cache = YOLO(model_path)
            print(f"[FIRE DETECTION] [OK] Fire detection model loaded successfully")
            # Print model class names to help debug
            if hasattr(_fire_model_cache, 'names'):
                class_names = list(_fire_model_cache.names.values())
                print(f"[FIRE DETECTION] Model has {len(class_names)} classes")
                print(f"[FIRE DETECTION] Class names: {class_names}")
                print(f"[FIRE DETECTION] Model path: {FIRE_MODEL_PATH}")
                print(f"[FIRE DETECTION] Treating as fire detection model: {IS_FIRE_MODEL}")
                if IS_FIRE_MODEL:
                    print(f"[FIRE DETECTION] [INFO] All detections from this model will be treated as fire")
                else:
                    print(f"[FIRE DETECTION] [INFO] Will only accept detections with fire-related labels")
        except Exception as e:
            print(f"[FIRE DETECTION] [ERROR] Error loading fire detection model: {e}")
            raise
    return _fire_model_cache


def detect_fire(
    image_source: str,
    confidence_threshold: float = 0.25,  # Lower threshold for fire detection
    save_results: bool = False
) -> List[Dict]:
    """
    Detect fire in an image using YOLO (same pattern as threat detection)
    
    Args:
        image_source: Path to image file, numpy array, or OpenCV frame
        confidence_threshold: Minimum confidence score (0-1)
        save_results: Whether to save annotated results
    
    Returns:
        List of detected fires with label, score, and bounding box
    """
    try:
        model = get_fire_model()
        
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
                    
                    # Filter for fire-related labels (strict to avoid false positives)
                    is_fire = any(fire_label in label for fire_label in FIRE_LABELS)
                    
                    # Only keep detections whose labels match fire terms
                    if is_fire:
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
        print(f"Error in fire detection: {e}")
        import traceback
        traceback.print_exc()
        return []


def detect_fire_from_bytes(image_bytes: bytes) -> List[Dict]:
    """
    Detect fire from image bytes
    
    Args:
        image_bytes: Image file bytes
    
    Returns:
        List of detected fires
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
            detections = detect_fire(temp_path, save_results=False)
            return detections
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        print(f"Error processing image bytes: {e}")
        return []


def detect_fire_from_numpy(image_np: np.ndarray, confidence_threshold: float = 0.15) -> List[Dict]:
    """
    Detect fire from numpy array (OpenCV format) - optimized for video frames
    
    Args:
        image_np: Image as numpy array (BGR format from OpenCV)
        confidence_threshold: Minimum confidence score
    
    Returns:
        List of detected fires
    """
    try:
        model = get_fire_model()
        
        # Run prediction directly on numpy array (faster than saving to file)
        results = model.predict(
            source=image_np,
            conf=confidence_threshold,
            save=False,
            verbose=False  # Reduce output
        )
        
        detections = []
        
        # Parse results (same pattern as threat detection)
        all_detections = []  # Track all detections for debugging
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    label_id = int(box.cls[0])
                    label = model.names[label_id].lower()
                    confidence = float(box.conf[0])
                    
                    # Store all detections for debugging
                    all_detections.append({
                        "label": model.names[label_id],
                        "label_lower": label,
                        "confidence": confidence
                    })
                    
                    # Filter for fire-related labels
                    is_fire = any(fire_label in label for fire_label in FIRE_LABELS)
                    
                    # If it's a fire detection model, accept ALL detections
                    # (since a fire detection model should only detect fire-related things)
                    # This makes it work with any fire detection model regardless of class names
                    
                    # Accept if: label matches fire terms OR it's a fire detection model OR confidence is high
                    # AGGRESSIVE MODE: Accept everything if it's a fire model
                    if IS_FIRE_MODEL or is_fire or confidence > 0.7:
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
        
        # AGGRESSIVE LOGGING: Always log what was detected
        if len(all_detections) > 0:
            if len(detections) == 0:
                print(f"[FIRE DETECTION DEBUG] Model detected {len(all_detections)} object(s) but none accepted as fire:")
                for det in all_detections[:5]:  # Show first 5
                    print(f"  - Label: '{det['label']}' (confidence: {det['confidence']:.2f})")
                print(f"[FIRE DETECTION DEBUG] Looking for labels containing: {FIRE_LABELS}")
                print(f"[FIRE DETECTION DEBUG] Model class names: {list(model.names.values())}")
                print(f"[FIRE DETECTION DEBUG] Model path: {FIRE_MODEL_PATH}")
                print(f"[FIRE DETECTION DEBUG] Is fire model: {IS_FIRE_MODEL}")
                print(f"[FIRE DETECTION DEBUG] Confidence threshold: {confidence_threshold}")
            else:
                print(f"[FIRE DETECTION] [OK] {len(detections)} fire detection(s) found!")
                for det in detections[:3]:
                    print(f"  - {det['label']}: {det['score']:.2f} confidence")
        else:
            # No detections at all from model
            print(f"[FIRE DETECTION DEBUG] No objects detected by model (confidence threshold: {confidence_threshold})")
        
        return detections
    
    except Exception as e:
        print(f"Error in fire detection from numpy: {e}")
        import traceback
        traceback.print_exc()
        return []


if __name__ == "__main__":
    # Test with sample image
    import sys
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"Testing fire detection on: {image_path}")
        fires = detect_fire(image_path, save_results=True)
        
        if fires:
            print(f"\n🔥 {len(fires)} fire(s) detected:")
            for fire in fires:
                print(f"  - {fire['label']}: {fire['score']:.2f} confidence")
        else:
            print("\n✅ No fire detected")
    else:
        print("Usage: python security_fire_detection.py <image_path>")

