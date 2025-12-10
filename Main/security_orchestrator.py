"""
Security Alert Orchestrator
Combines threat detection and TTS for security alerts
"""
import os
import sys
from typing import Optional, Dict
from security_threat_detection import detect_threats_from_bytes, detect_threats
from security_text_to_speech import synthesize_alert_speech_base64


def build_alert_text(threats: list, vehicle_info: dict) -> str:
    """Build natural-language alert sentence"""
    parts = []
    
    # Start with attention call
    parts.append('Attention security.')
    
    # Add vehicle description
    vehicle_desc = []
    if vehicle_info.get('vehicleColor'):
        vehicle_desc.append(vehicle_info['vehicleColor'])
    if vehicle_info.get('vehicleType'):
        vehicle_desc.append(vehicle_info['vehicleType'])
    elif vehicle_desc:
        vehicle_desc.append('vehicle')
    
    if vehicle_desc or vehicle_info.get('plateNumber'):
        vehicle_str = ' '.join(vehicle_desc) if vehicle_desc else 'vehicle'
        
        if vehicle_info.get('plateNumber'):
            parts.append(f"{vehicle_str} near {vehicle_info['zoneName']}, plate {vehicle_info['plateNumber']}.")
        else:
            parts.append(f"{vehicle_str} near {vehicle_info['zoneName']}.")
    else:
        parts.append(f"Activity detected near {vehicle_info['zoneName']}.")
    
    # Add threat information
    threat_labels = [t['label'].lower() for t in threats]
    unique_threats = list(set(threat_labels))
    
    if unique_threats:
        if len(unique_threats) == 1:
            parts.append(f"Possible {unique_threats[0]} detected.")
        else:
            last_threat = unique_threats.pop()
            parts.append(f"Possible {', '.join(unique_threats)} and {last_threat} detected.")
    
    # Add urgency
    parts.append('Please respond immediately.')
    
    return ' '.join(parts)


def process_security_alert(
    image_source: str,
    vehicle_info: dict,
    image_is_bytes: bool = False
) -> Dict:
    """
    Process security alert: detect threats and generate alert speech
    
    Args:
        image_source: Image path/URL or image bytes (if image_is_bytes=True)
        vehicle_info: Dict with zoneName, vehicleColor, vehicleType, plateNumber
        image_is_bytes: Whether image_source is bytes
    
    Returns:
        Dict with hasThreat, threats, alertText, and audio fields
    """
    try:
        # Step 1: Detect threats
        if image_is_bytes:
            threats = detect_threats_from_bytes(image_source)
        else:
            threats = detect_threats(image_source, save_results=False)
        
        # Step 2: If no threats, return early
        if not threats:
            return {
                "hasThreat": False,
                "threats": [],
                "alertText": "",
                "audio": {
                    "base64": "",
                    "mimeType": "audio/wav"
                }
            }
        
        # Step 3: Build alert text
        alert_text = build_alert_text(threats, vehicle_info)
        
        # Step 4: Generate speech
        audio_result = synthesize_alert_speech_base64(alert_text)
        
        if not audio_result:
            print("Warning: TTS failed, but threat detected. Alert text available.")
            return {
                "hasThreat": True,
                "threats": threats,
                "alertText": alert_text,
                "audio": {
                    "base64": "",
                    "mimeType": "audio/wav"
                }
            }
        
        # Step 5: Return complete response
        return {
            "hasThreat": True,
            "threats": threats,
            "alertText": alert_text,
            "audio": audio_result
        }
    
    except Exception as e:
        print(f"Error in security alert orchestration: {e}")
        import traceback
        traceback.print_exc()
        return {
            "hasThreat": False,
            "threats": [],
            "alertText": "",
            "audio": {
                "base64": "",
                "mimeType": "audio/wav"
            }
        }


if __name__ == "__main__":
    # Test the orchestrator
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python security_orchestrator.py <image_path> <zone_name> [vehicle_color] [vehicle_type] [plate]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    zone_name = sys.argv[2]
    vehicle_color = sys.argv[3] if len(sys.argv) > 3 else None
    vehicle_type = sys.argv[4] if len(sys.argv) > 4 else None
    plate = sys.argv[5] if len(sys.argv) > 5 else None
    
    vehicle_info = {
        "zoneName": zone_name,
        "vehicleColor": vehicle_color,
        "vehicleType": vehicle_type,
        "plateNumber": plate
    }
    
    print(f"Processing security alert for: {zone_name}")
    result = process_security_alert(image_path, vehicle_info)
    
    print(f"\nResult:")
    print(f"  Has Threat: {result['hasThreat']}")
    print(f"  Threats: {len(result['threats'])}")
    
    if result['hasThreat']:
        print(f"  Alert Text: {result['alertText']}")
        print(f"  Audio: {'Generated' if result['audio']['base64'] else 'Failed'}")
        
        # Save audio if generated
        if result['audio']['base64']:
            import base64
            audio_bytes = base64.b64decode(result['audio']['base64'])
            with open("security_alert.wav", "wb") as f:
                f.write(audio_bytes)
            print(f"  Saved audio to: security_alert.wav")








