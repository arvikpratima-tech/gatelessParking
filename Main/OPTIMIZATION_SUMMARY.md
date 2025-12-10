# ALPR Application Optimization Summary

## Overview
This document summarizes the optimizations and improvements made to the ALPR desktop application (`main.py`).

## Key Optimizations Implemented

### 1. Performance & Responsiveness ✅

#### Frame Processing Optimization
- **Frame Resizing**: Frames are now automatically resized to a configurable width (default: 800px) before ALPR processing, significantly reducing processing time
- **ROI (Region of Interest) Support**: Optional bottom region cropping (configurable via `ENABLE_ROI` and `ROI_BOTTOM_PERCENT` env vars)
- **Reduced Frame Copies**: Eliminated unnecessary `frame.copy()` calls where possible
- **Bounded Queue**: Detection worker now uses a bounded `Queue` (max size: 3) instead of unbounded list to prevent memory issues

#### Network Call Optimization
- **Background Network Worker**: All API calls now run in a separate `NetworkWorker` thread, preventing GUI freezing
- **Non-blocking Requests**: `send_plate_to_backend()` is now completely non-blocking
- **Error Rate Limiting**: Modal dialogs only show for first few network errors to avoid spam

### 2. Code Structure & Readability ✅

#### Type Hints & Documentation
- Added comprehensive type hints throughout (`typing` module)
- Added detailed docstrings to all classes and key methods
- Improved code organization with clear section separators

#### Method Refactoring
- Broke down large methods into smaller, focused functions
- Created `preprocess_frame_for_detection()` utility function
- Improved separation of concerns

### 3. Threading & Safety ✅

#### Camera Thread Improvements
- Better resource cleanup (proper `VideoCapture` release)
- Configurable retry logic and connection delays
- Improved error handling with automatic reconnection

#### Detection Worker Improvements
- Bounded queue with `Queue` from `queue` module
- Thread-safe queue operations with mutex protection
- Proper cleanup on shutdown

#### Network Worker
- New dedicated thread for all API calls
- Queue-based request handling
- Graceful shutdown

### 4. Backend Integration ✅

#### API Contract Maintained
- HTTP POST to `BACKEND_API` endpoint
- `Authorization: Token <APP_KEY>` header format preserved
- Payload structure unchanged (plate, address, timestamp)
- Optional fields: `locationId`, `cameraId` (if configured)

#### Error Handling
- Meaningful error logging to GUI log panel
- Reduced modal dialog spam (only first N errors)
- Network errors tracked but don't block detection

### 5. Configurability ✅

#### Centralized Configuration
All settings are now in the `AppConfig` dataclass with environment variable support:

**Frame Processing:**
- `FRAME_RESIZE_WIDTH` (default: 800) - Width to resize frames before processing
- `ENABLE_ROI` (default: false) - Enable region of interest cropping
- `ROI_BOTTOM_PERCENT` (default: 0.4) - Percentage of bottom frame to use for ROI
- `FRAME_SKIP` (default: 2) - Process every Nth frame

**Detection:**
- `DETECTION_INTERVAL_MS` (default: 1000) - Minimum time between detections
- `MAX_QUEUE_SIZE` (default: 3) - Maximum frames in detection queue

**Plate Validator:**
- `COOLDOWN_TIME` (default: 30) - Seconds before same plate can be detected again
- `SIMILARITY_THRESHOLD` (default: 0.7) - Levenshtein similarity threshold
- `MAX_HISTORY` (default: 10) - Maximum plates in history
- `HISTORY_CLEANUP_SECONDS` (default: 300) - Cleanup old records after N seconds

**Camera:**
- `CAMERA_BUFFER_SIZE` (default: 1) - OpenCV buffer size
- `CAMERA_FPS` (default: 15) - Target FPS
- `CAMERA_FRAME_DELAY_MS` (default: 50) - Delay between frame captures
- `MAX_CONSECUTIVE_FAILURES` (default: 10) - Failures before reconnection
- `CONNECTION_RETRY_DELAY_MS` (default: 5000) - Delay before retry

**Network:**
- `REQUEST_TIMEOUT` (default: 10) - API request timeout in seconds
- `MAX_NETWORK_ERRORS` (default: 3) - Errors before showing dialog

**API Configuration (existing):**
- `BACKEND_API` - Backend API endpoint URL
- `APP_KEY` - Authentication token
- `LOCATION` - Location name
- `LOCATION_ID` - Optional location ID
- `CAMERA_ID` - Optional camera ID

### 6. Maintained Features ✅

All existing features preserved:
- ✅ Plate validation and deduplication (`PlateValidator`)
- ✅ Auto vs Manual detection modes
- ✅ Detection history reset button
- ✅ Start/stop camera functionality
- ✅ Upload Image fallback button
- ✅ Logging to QTextEdit log panel
- ✅ Statistics: total detections, successful sends, skipped duplicates

## New Features

1. **Frame Preprocessing**: Automatic resize and optional ROI cropping
2. **Background Network Worker**: Non-blocking API calls
3. **Better Error Handling**: Reduced modal spam, better logging
4. **Configuration System**: Centralized config with env var overrides

## Environment Variables Reference

### Required
- `BACKEND_API` - Backend API endpoint (e.g., `https://my-app.vercel.app/api/plate`)
- `APP_KEY` - Authentication token

### Optional
- `LOCATION` - Location name (default: "Underground Parking Lot")
- `LOCATION_ID` - Location identifier
- `CAMERA_ID` - Camera identifier

### Performance Tuning (Optional)
- `FRAME_RESIZE_WIDTH` - Frame width for processing (default: 800)
- `ENABLE_ROI` - Enable ROI cropping (default: false)
- `ROI_BOTTOM_PERCENT` - ROI percentage (default: 0.4)
- `FRAME_SKIP` - Process every Nth frame (default: 2)
- `DETECTION_INTERVAL_MS` - Min time between detections (default: 1000)
- `MAX_QUEUE_SIZE` - Max frames in queue (default: 3)
- `COOLDOWN_TIME` - Plate cooldown in seconds (default: 30)
- `SIMILARITY_THRESHOLD` - Similarity threshold 0-1 (default: 0.7)

## Performance Improvements

### Before Optimization
- Frames processed at full resolution
- Network calls block GUI thread
- Unbounded frame queue
- Hard-coded configuration values
- Multiple unnecessary frame copies

### After Optimization
- Frames resized to 800px width (configurable)
- Network calls in background thread
- Bounded queue (max 3 frames)
- All settings configurable via env vars
- Reduced memory copies

## Code Quality Improvements

- ✅ Comprehensive type hints
- ✅ Detailed docstrings
- ✅ Better error handling
- ✅ Thread-safe operations
- ✅ Proper resource cleanup
- ✅ Modular, maintainable code structure

## Testing Recommendations

1. **Performance Testing**: Monitor CPU and memory usage with different `FRAME_RESIZE_WIDTH` values
2. **Network Testing**: Test with slow/unreliable network connections
3. **Camera Testing**: Test with various IP camera sources and connection failures
4. **Detection Testing**: Verify plate validation and deduplication still work correctly

## Migration Notes

- No breaking changes to API contract
- All existing functionality preserved
- New configuration options are optional (sensible defaults provided)
- Code is backward compatible with existing `.env` files

## Future Enhancement Opportunities

1. **Offline Queue**: Lightweight offline queue for failed API calls (structure prepared)
2. **ML-based OCR Correction**: Enhance plate text cleaning with ML models
3. **Performance Metrics**: Add detailed performance monitoring
4. **Configuration UI**: GUI for adjusting settings without editing env vars

