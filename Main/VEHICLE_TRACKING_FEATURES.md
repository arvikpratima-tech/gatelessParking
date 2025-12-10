# Vehicle Tracking & Duration Features

## Overview
This document describes the new vehicle tracking, booking retrieval, and duration calculation features added to the ALPR application.

## New Features Added

### 1. Backend API Enhancement ✅

**File: `app/api/plate/route.ts`**

The API now returns comprehensive booking information when a plate is detected:

**Response for vehicles WITH booking:**
```json
{
  "message": "ok",
  "hasBooking": true,
  "booking": {
    "id": "booking_id",
    "plate": "ABC123",
    "starttime": "2024-01-15T10:00:00Z",
    "endtime": "2024-01-15T14:00:00Z",
    "bookingdate": "2024-01-15T00:00:00Z",
    "amount": 20.00,
    "status": "BOOKED"
  },
  "duration": {
    "minutes": 120,
    "hours": 2,
    "minutesRemainder": 0,
    "remainingMinutes": 60,
    "remainingHours": 1,
    "remainingMinutesRemainder": 0,
    "isWithinBooking": true,
    "isOverstayed": false
  }
}
```

**Response for vehicles WITHOUT booking (violations):**
```json
{
  "message": "violation",
  "hasBooking": false
}
```

### 2. Vehicle Tracking System ✅

**Data Models Added:**
- `BookingInfo`: Stores booking information from backend
- `DurationInfo`: Stores calculated duration and remaining time
- `VehicleDetection`: Complete vehicle tracking information including:
  - Plate number
  - Detection timestamp
  - Booking information
  - Duration information
  - Entry/exit times
  - Violation status

**Features:**
- Tracks first detection time (entry)
- Tracks last seen time
- Calculates local stay duration (from first detection)
- Stores booking information from backend
- Tracks violation status

### 3. Duration Calculation ✅

**Backend Calculations:**
- Current stay duration (from booking start time to now)
- Remaining time (from now to booking end time)
- Overstay detection (if current time > end time)
- Within booking period check

**Frontend Calculations:**
- Local duration (from first detection to now)
- Real-time updates every 30 seconds
- Formatted display (hours and minutes)

### 4. UI Components ✅

**New UI Elements Added:**

1. **Vehicle Information Panel**
   - Shows current vehicle plate
   - First detected time
   - Last seen time
   - Local duration (from first detection)
   - Color-coded: Green for valid, Red for violations

2. **Booking Details Panel**
   - Booking status
   - Start time
   - End time
   - Amount paid
   - Color-coded:
     - Green: Within booking period
     - Orange: Overstayed
     - Blue: Booking period not started

3. **Duration Display**
   - Current stay duration (from booking start)
   - Remaining time (if within booking)
   - Overstay duration (if overstayed)
   - Updates every 30 seconds automatically

### 5. Real-time Updates ✅

- **Automatic Duration Updates**: Timer updates duration display every 30 seconds
- **Live Tracking**: Vehicle information updates when new detections occur
- **Backend Sync**: Booking information retrieved automatically on each detection

## How It Works

### Detection Flow

1. **Plate Detected** → `handle_plate_detection()` called
2. **Vehicle Tracking Initialized** → Entry time recorded
3. **API Request Sent** → Non-blocking request to backend
4. **Response Received** → `handle_network_success()` processes booking data
5. **UI Updated** → Vehicle information, booking details, and duration displayed
6. **Periodic Updates** → Timer updates duration every 30 seconds

### Data Flow

```
Plate Detection
    ↓
Vehicle Tracking Created (entry_time set)
    ↓
API Request (non-blocking)
    ↓
Backend Response (with booking data)
    ↓
Vehicle Tracking Updated (booking, duration)
    ↓
UI Display Updated
    ↓
Periodic Timer Updates Duration
```

## Usage

### For Valid Bookings

When a vehicle with a valid booking is detected:
- ✅ Green border on vehicle info
- ✅ Booking details shown (start, end, amount)
- ✅ Duration displayed (current stay time)
- ✅ Remaining time shown (if within booking period)
- ✅ Status: "Within Booking Period"

### For Violations

When a vehicle without a booking is detected:
- 🚨 Red border on vehicle info
- 🚨 "VIOLATION" label displayed
- 🚨 "No active booking found" message
- 🚨 Violation email sent by backend

### For Overstayed Vehicles

When a vehicle exceeds booking end time:
- ⚠️ Orange border on booking details
- ⚠️ "OVERSTAYED" label
- ⚠️ Overstay duration displayed
- ⚠️ Status: "Overstayed by Xh Ym"

## Configuration

No additional configuration required. All features work with existing environment variables:
- `BACKEND_API` - API endpoint
- `APP_KEY` - Authentication token
- `LOCATION` - Location name

## Technical Details

### Thread Safety
- Vehicle tracking dictionary is accessed from main thread only
- Network worker signals update UI thread safely
- Timer updates are thread-safe

### Memory Management
- Vehicle tracking entries persist during session
- Old entries can be cleaned up (currently kept for 1 hour after last seen)
- No memory leaks from tracking system

### Error Handling
- Graceful handling of missing booking data
- Time parsing errors caught and logged
- Network errors don't break vehicle tracking
- UI shows appropriate messages for all states

## Future Enhancements

Potential improvements:
1. **Vehicle History**: Store detection history across sessions
2. **Export Reports**: Export vehicle tracking data
3. **Multiple Vehicles**: Display multiple vehicles simultaneously
4. **Advanced Analytics**: Parking patterns, peak times, etc.
5. **Database Integration**: Store tracking data in database
6. **Notifications**: Alerts for violations or overstays

## Testing Checklist

- [x] Backend returns booking information correctly
- [x] Vehicle tracking initializes on detection
- [x] Duration calculations are accurate
- [x] UI displays all information correctly
- [x] Violations are properly identified
- [x] Overstays are detected and displayed
- [x] Periodic updates work correctly
- [x] Error handling works for edge cases
- [x] Thread safety maintained
- [x] Memory management is efficient

## Notes

- Duration updates every 30 seconds (configurable via timer interval)
- Vehicle tracking persists for the session duration
- Booking information is fetched on each detection (can be optimized with caching)
- All time calculations handle timezone conversions properly
- UI is responsive and doesn't freeze during updates

