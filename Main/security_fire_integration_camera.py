"""
Fire Detection Integration for Camera System
Integrates fire detection into the ALPR camera pipeline (same as threat detection)
"""
import os
from typing import Optional, Dict, List
from security_fire_detection import detect_fire_from_numpy, detect_fire
from security_fire_audio import play_fire_alert, stop_fire_alert, is_playing

# Configuration from environment
ENABLE_FIRE_DETECTION = os.getenv("ENABLE_FIRE_DETECTION", "true").lower() == "true"
FIRE_DETECTION_INTERVAL = int(os.getenv("FIRE_DETECTION_INTERVAL", "3"))  # Check every 3rd frame (more frequent)
FIRE_CONFIDENCE_THRESHOLD = float(os.getenv("FIRE_CONFIDENCE_THRESHOLD", "0.15"))  # Lower threshold (more sensitive)


def detect_fire_in_frame(frame, frame_counter: int) -> Optional[List[Dict]]:
    """
    Detect fire in a video frame (same pattern as threat detection)
    
    Args:
        frame: OpenCV frame (numpy array)
        frame_counter: Current frame number
    
    Returns:
        List of detected fires, or None if not checked
    """
    if not ENABLE_FIRE_DETECTION:
        return None
    
    # Only check every Nth frame (performance optimization)
    if frame_counter % FIRE_DETECTION_INTERVAL != 0:
        return None
    
    try:
        # Detect fire in frame (same as threat detection)
        fires = detect_fire_from_numpy(frame, confidence_threshold=FIRE_CONFIDENCE_THRESHOLD)
        
        if fires and len(fires) > 0:
            print(f"[FIRE DETECTED] {len(fires)} fire instance(s) at frame {frame_counter}")
            for fire in fires:
                print(f"   - {fire['label']}: {fire['score']:.2f} confidence")
            return fires
        
        return []  # Checked but no fire
    
    except Exception as e:
        print(f"Error in fire detection: {e}")
        return None


def handle_fire_alert(fires: List[Dict], zone_name: str = "Camera", plate: Optional[str] = None):
    """
    Handle fire alert - play audio and log (same pattern as threat alerts)
    
    Args:
        fires: List of detected fires
        zone_name: Location/zone name
        plate: Vehicle plate number (if available)
    """
    if not fires or len(fires) == 0:
        return
    
    # Build alert message
    fire_count = len(fires)
    fire_labels = [f.get('label', 'fire') for f in fires[:3]]
    alert_msg = f"[FIRE DETECTED] at {zone_name}"
    if plate:
        alert_msg += f" (Plate: {plate})"
    alert_msg += f": {', '.join(fire_labels)}"
    if fire_count > 3:
        alert_msg += f" and {fire_count - 3} more"
    
    print(f"[FIRE ALERT] {alert_msg}")
    
    # Play fire alert audio
    if not is_playing():
        play_fire_alert()
        print("[AUDIO] Fire alert audio started")
    else:
        print("[AUDIO] Fire alert audio already playing")


def stop_fire_alert_if_no_fire(fires: Optional[List[Dict]]):
    """
    Stop fire alert if no fire detected (optional cleanup)
    
    Args:
        fires: List of fires (None = not checked, [] = no fire, [...] = fire detected)
    """
    if fires is not None and len(fires) == 0:
        if is_playing():
            stop_fire_alert()
            print("[AUDIO] Fire alert audio stopped (no fire detected)")


# Example integration in camera loop (similar to threat detection):
"""
# In your PlateDetectionWorker.run() or camera loop:

# After plate detection, check for fire:
detected_fires = detect_fire_in_frame(
    self.current_frame,  # Same frame used for plate detection
    self.frame_counter
)

# If fire detected, handle alert
if detected_fires and len(detected_fires) > 0:
    handle_fire_alert(
        detected_fires,
        zone_name=self.config.location,
        plate=detected_plate  # If plate was detected
    )
"""

