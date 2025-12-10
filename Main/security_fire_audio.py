"""
Fire Alert Audio Player
Plays fire alert MP3 file in a loop when fire is detected
"""
import os
import threading
import time
from pathlib import Path
from typing import Optional

try:
    import pygame
    PYGAME_AVAILABLE = True
    # Don't initialize here - wait until we actually need it
except ImportError as e:
    PYGAME_AVAILABLE = False
    print(f"[FIRE AUDIO] [ERROR] pygame not available: {e}")
    print("[FIRE AUDIO] Install with: pip install pygame")
    print("[FIRE AUDIO] Or activate your virtual environment and run: pip install pygame")
except Exception as e:
    PYGAME_AVAILABLE = False
    print(f"[FIRE AUDIO] [ERROR] pygame import failed: {e}")
    print("[FIRE AUDIO] Try: pip install pygame")

# Configuration
FIRE_AUDIO_FILE = os.getenv("FIRE_AUDIO_FILE", "ma-ka-bhosda-aag.mp3")
AUDIO_VOLUME = float(os.getenv("FIRE_AUDIO_VOLUME", "1.0"))  # 0.0 to 1.0
AUTO_STOP_MINUTES = int(os.getenv("FIRE_AUDIO_AUTO_STOP_MINUTES", "5"))  # Auto-stop after 5 minutes

# Global state
_audio_thread: Optional[threading.Thread] = None
_audio_stop_event = threading.Event()
_audio_playing = False
_pygame_initialized = False


def initialize_pygame():
    """Initialize pygame mixer (only once)"""
    global _pygame_initialized
    if not PYGAME_AVAILABLE:
        return False
    
    if not _pygame_initialized:
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)
            _pygame_initialized = True
            print("[FIRE AUDIO] [OK] Fire alert audio system initialized")
            return True
        except Exception as e:
            print(f"[FIRE AUDIO] [ERROR] Error initializing pygame mixer: {e}")
            return False
    return True


def find_audio_file() -> Optional[str]:
    """
    Find the fire alert audio file
    Checks multiple possible locations
    """
    script_dir = os.path.dirname(__file__)  # Main/ directory
    current_dir = os.getcwd()
    # Possible locations
    possible_paths = [
        # Same directory as this script (Main/)
        os.path.join(script_dir, FIRE_AUDIO_FILE),
        # .venv directory (Main/.venv/)
        os.path.join(script_dir, ".venv", FIRE_AUDIO_FILE),
        os.path.join(os.path.dirname(script_dir), ".venv", FIRE_AUDIO_FILE),
        # Current working directory
        os.path.join(current_dir, FIRE_AUDIO_FILE),
        # Current dir/.venv/
        os.path.join(current_dir, ".venv", FIRE_AUDIO_FILE),
        # Parent directory
        os.path.join(os.path.dirname(script_dir), "public", FIRE_AUDIO_FILE),
        # Public folder
        os.path.join(os.getcwd(), "public", FIRE_AUDIO_FILE),
        # Just the filename (if in PATH)
        FIRE_AUDIO_FILE,
    ]
    
    for path in possible_paths:
        if os.path.exists(path) and os.path.isfile(path):
            return path
    
    return None


def _play_audio_loop(audio_path: str, stop_event: threading.Event):
    """
    Internal function to play audio in a loop
    Runs in a separate thread
    """
    global _audio_playing
    
    if not PYGAME_AVAILABLE:
        print("[FIRE AUDIO] [ERROR] Cannot play fire alert audio: pygame not available")
        print("[FIRE AUDIO] Install pygame in your virtual environment: pip install pygame")
        _audio_playing = False
        return
    
    if not initialize_pygame():
        print("[FIRE AUDIO] [ERROR] Cannot play fire alert audio: pygame initialization failed")
        _audio_playing = False
        return
    
    try:
        _audio_playing = True
        start_time = time.time()
        auto_stop_time = start_time + (AUTO_STOP_MINUTES * 60)
        
        print(f"🔥 FIRE ALERT: Playing audio alert: {audio_path}")
        
        while not stop_event.is_set():
            # Check auto-stop timeout
            if time.time() >= auto_stop_time:
                print(f"Fire alert audio auto-stopped after {AUTO_STOP_MINUTES} minutes")
                break
            
            try:
                # Load and play audio
                pygame.mixer.music.load(audio_path)
                pygame.mixer.music.set_volume(AUDIO_VOLUME)
                pygame.mixer.music.play()
                
                # Wait for audio to finish or stop event
                while pygame.mixer.music.get_busy() and not stop_event.is_set():
                    # Check timeout during playback
                    if time.time() >= auto_stop_time:
                        break
                    time.sleep(0.1)
                
                # If stopped, break the loop
                if stop_event.is_set():
                    break
                
                # If auto-stop time reached, break
                if time.time() >= auto_stop_time:
                    break
                
                # Otherwise, loop continues automatically
                
            except Exception as e:
                print(f"Error playing fire alert audio: {e}")
                break
        
        # Stop and cleanup
        try:
            pygame.mixer.music.stop()
        except:
            pass
        
        _audio_playing = False
        print("Fire alert audio stopped")
        
    except Exception as e:
        print(f"Error in fire alert audio thread: {e}")
        _audio_playing = False


def play_fire_alert():
    """
    Play fire alert audio in a loop
    Starts a background thread to play the audio
    """
    global _audio_thread, _audio_stop_event, _audio_playing
    
    # Check pygame first
    if not PYGAME_AVAILABLE:
        print(f"[FIRE AUDIO] [ERROR] Cannot play audio: pygame not available")
        print(f"[FIRE AUDIO] Install pygame in virtual environment: pip install pygame")
        return
    
    # If already playing, don't start another
    if _audio_playing:
        print("[FIRE AUDIO] Fire alert audio already playing")
        return
    
    # Find audio file
    audio_path = find_audio_file()
    if not audio_path:
        print(f"[FIRE AUDIO] [WARNING] Fire alert audio file not found: {FIRE_AUDIO_FILE}")
        print("[FIRE AUDIO] Please ensure the MP3 file is in one of these locations:")
        print("   - Main/ directory")
        print("   - Main/.venv/ directory")
        print("   - Current working directory")
        return
    
    # Stop any existing playback
    stop_fire_alert()
    
    # Reset stop event
    _audio_stop_event = threading.Event()
    
    # Start audio thread
    _audio_thread = threading.Thread(
        target=_play_audio_loop,
        args=(audio_path, _audio_stop_event),
        daemon=True,
        name="FireAlertAudio"
    )
    _audio_thread.start()
    
    print(f"[FIRE AUDIO] [OK] Fire alert audio started (will auto-stop after {AUTO_STOP_MINUTES} minutes)")


def stop_fire_alert():
    """
    Stop the fire alert audio playback
    """
    global _audio_thread, _audio_stop_event, _audio_playing
    
    if _audio_playing:
        print("Stopping fire alert audio...")
        _audio_stop_event.set()
        
        # Wait for thread to finish (with timeout)
        if _audio_thread and _audio_thread.is_alive():
            _audio_thread.join(timeout=2.0)
        
        # Force stop pygame music
        if _pygame_initialized:
            try:
                pygame.mixer.music.stop()
            except:
                pass
        
        _audio_playing = False
        print("Fire alert audio stopped")


def is_playing() -> bool:
    """Check if fire alert audio is currently playing"""
    return _audio_playing


def get_audio_file_path() -> Optional[str]:
    """Get the path to the fire alert audio file (if found)"""
    return find_audio_file()


if __name__ == "__main__":
    # Test the fire alert audio
    print("Testing fire alert audio system...")
    
    audio_path = find_audio_file()
    if audio_path:
        print(f"Found audio file: {audio_path}")
        print("Playing fire alert audio for 10 seconds...")
        play_fire_alert()
        time.sleep(10)
        stop_fire_alert()
        print("Test complete")
    else:
        print(f"Audio file not found: {FIRE_AUDIO_FILE}")
        print("Please ensure the MP3 file is in the correct location")

