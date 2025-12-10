"""
Fire Detection Integration Helper
Easy integration of fire detection audio alerts with ALPR system
Works with API responses from /api/plate endpoint
"""
from typing import Dict, Optional
from security_fire_audio import play_fire_alert, stop_fire_alert, is_playing


def check_and_play_fire_alert(api_response: Dict) -> bool:
    """
    Check API response for fire detection and play audio if fire is detected
    
    Args:
        api_response: Response dictionary from /api/plate endpoint
    
    Returns:
        True if fire was detected and audio started, False otherwise
    """
    # Check for fire alert in response
    fire_alert = api_response.get('fireAlert')
    
    if fire_alert and fire_alert.get('hasFire'):
        fires = fire_alert.get('fires', [])
        if fires and len(fires) > 0:
            # Fire detected - play audio
            if not is_playing():
                play_fire_alert()
                return True
            return True  # Already playing
    
    # No fire detected - stop audio if playing
    if is_playing():
        stop_fire_alert()
    
    return False


def get_fire_alert_info(api_response: Dict) -> Optional[Dict]:
    """
    Extract fire alert information from API response
    
    Args:
        api_response: Response dictionary from /api/plate endpoint
    
    Returns:
        Dictionary with fire alert info, or None if no fire
    """
    fire_alert = api_response.get('fireAlert')
    
    if fire_alert and fire_alert.get('hasFire'):
        return {
            'hasFire': True,
            'fires': fire_alert.get('fires', []),
            'fireCount': len(fire_alert.get('fires', [])),
            'fireId': api_response.get('fireId')  # If available
        }
    
    return None


def format_fire_alert_message(fire_info: Dict) -> str:
    """
    Format a human-readable fire alert message
    
    Args:
        fire_info: Fire alert info dictionary
    
    Returns:
        Formatted message string
    """
    fire_count = fire_info.get('fireCount', 0)
    fires = fire_info.get('fires', [])
    
    if fire_count == 0:
        return "🔥 FIRE DETECTED"
    
    fire_labels = [f.get('label', 'fire') for f in fires[:3]]  # First 3
    if fire_count > 3:
        fire_labels.append(f"and {fire_count - 3} more")
    
    labels_str = ', '.join(fire_labels)
    return f"🔥 FIRE DETECTED: {labels_str} ({fire_count} instance(s))"


# Example usage function
def example_integration():
    """
    Example of how to integrate fire detection in ALPR system
    """
    # Simulate API response
    api_response = {
        "message": "ok",
        "hasBooking": True,
        "fireAlert": {
            "hasFire": True,
            "fires": [
                {"label": "fire", "score": 0.95},
                {"label": "flame", "score": 0.87}
            ]
        },
        "fireId": "some_id"
    }
    
    # Check and play fire alert
    fire_detected = check_and_play_fire_alert(api_response)
    
    if fire_detected:
        # Get fire info for display
        fire_info = get_fire_alert_info(api_response)
        if fire_info:
            message = format_fire_alert_message(fire_info)
            print(message)
            # Display in GUI, log, etc.


if __name__ == "__main__":
    print("Fire Detection Integration Helper")
    print("=" * 50)
    print("\nExample usage:")
    example_integration()

