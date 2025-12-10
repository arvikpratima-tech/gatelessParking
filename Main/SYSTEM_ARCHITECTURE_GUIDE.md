# System Architecture Guide - Dual Camera, Duration & Overstay Tracking

This comprehensive guide explains how the entire system works: dual camera setup, duration tracking, overstay detection, MongoDB integration, and charge calculation.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Dual Camera Operation Flow](#dual-camera-operation-flow)
3. [Duration Tracking System](#duration-tracking-system)
4. [Overstay Detection & Display](#overstay-detection--display)
5. [MongoDB Integration Flow](#mongodb-integration-flow)
6. [Charge Calculation System](#charge-calculation-system)
7. [Real-time Updates Mechanism](#real-time-updates-mechanism)
8. [Complete Data Flow Diagram](#complete-data-flow-diagram)

---

## System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ALPR CAMERA SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│  Entry Camera App          Exit Camera App                   │
│  (Python PyQt6)            (Python PyQt6)                    │
│  - Detects plates          - Detects plates                  │
│  - Validates entry         - Validates exit                  │
│  - Tracks duration         - Checks overstay                 │
│  - Security alerts         - Security alerts                 │
└───────────────┬─────────────────────┬───────────────────────┘
                │                     │
                │ HTTP POST           │ HTTP POST
                │ /api/plate          │ /api/plate
                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS BACKEND SERVER                          │
│              (http://localhost:3000)                         │
├─────────────────────────────────────────────────────────────┤
│  API Routes:                                                 │
│  - /api/plate (plate detection & validation)                 │
│  - /api/security/alert (threat detection)                    │
│  - /api/security/threat-detection                            │
│  - /api/security/text-to-speech                              │
└───────────────┬──────────────────────────────────────────────┘
                │
                │ MongoDB Queries
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│  Collections:                                                │
│  - Bookings (booking status, times, amounts)                 │
│  - ParkingLocations (location details, pricing)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Dual Camera Operation Flow

### Step-by-Step Process

#### 1. Startup Sequence

```
START BACKEND SERVER
    ↓
npm run dev (runs on port 3000)
    ↓
MongoDB Connection Established
    ↓
API Routes Ready
```

```
START ENTRY CAMERA
    ↓
cd Main/.venv
python.exe main.py
    ↓
GUI Window Opens
    ↓
Configure Camera URL
    ↓
Start Camera Feed
    ↓
Auto Mode Enabled
    ↓
Plate Detection Active
```

```
START EXIT CAMERA
    ↓
cd Main/.venv (separate instance)
python.exe main.py
    ↓
GUI Window Opens (2nd window)
    ↓
Configure Exit Camera URL
    ↓
Start Camera Feed
    ↓
Auto Mode Enabled
    ↓
Plate Detection Active
```

### 2. Real-Time Detection Flow

#### Entry Camera Detection:
```
Vehicle Enters → Camera Sees Plate
    ↓
Plate Detected (e.g., "KA01AB1234")
    ↓
Clean & Validate Plate Text
    ↓
Check Cooldown (prevent duplicates)
    ↓
Send HTTP POST to /api/plate
    ↓
Payload:
{
  "plate": "KA01AB1234",
  "address": "Main Gate Entry",
  "timestamp": "2024-12-08T14:30:00",
  "locationId": "entry-gate-1",
  "cameraId": "camera-entry-1"
}
    ↓
Backend Queries MongoDB
    ↓
Finds Booking (if exists)
    ↓
Calculates Duration & Overstay
    ↓
Returns Response
```

#### Exit Camera Detection:
```
Vehicle Exits → Camera Sees Plate
    ↓
Plate Detected (e.g., "KA01AB1234")
    ↓
Clean & Validate Plate Text
    ↓
Check Cooldown
    ↓
Send HTTP POST to /api/plate
    ↓
Payload:
{
  "plate": "KA01AB1234",
  "address": "Main Gate Exit",
  "timestamp": "2024-12-08T16:45:00",
  "locationId": "exit-gate-1",
  "cameraId": "camera-exit-1"
}
    ↓
Backend Queries MongoDB
    ↓
Checks Booking Status
    ↓
Calculates Overstay (if applicable)
    ↓
Returns Response
```

---

## Duration Tracking System

### How Duration is Calculated

#### Backend Calculation (Real-time on Each Detection)

**Location:** `app/api/plate/route.ts`

```typescript
// When plate is detected, backend:
1. Queries MongoDB for booking:
   BookingModel.findOne({
     plate: plate.toLowerCase(),
     status: BookingStatus.BOOKED
   })

2. Gets current time:
   const now = new Date()

3. Calculates Duration Since Booking Start:
   const durationMinutes = Math.floor(
     (now.getTime() - booking.starttime.getTime()) / (1000 * 60)
   )

4. Calculates Remaining Time:
   const remainingMinutes = Math.floor(
     (booking.endtime.getTime() - now.getTime()) / (1000 * 60)
   )

5. Checks Overstay:
   const isOverstayed = now > booking.endtime

6. Returns Response:
{
  "message": "ok",
  "hasBooking": true,
  "booking": {...},
  "duration": {
    "minutes": 120,           // Total time since booking start
    "hours": 2,
    "minutesRemainder": 0,
    "remainingMinutes": 60,   // Time left in booking
    "remainingHours": 1,
    "remainingMinutesRemainder": 0,
    "isWithinBooking": true,  // Currently within booking period
    "isOverstayed": false     // Has exceeded end time
  }
}
```

#### Frontend (Python App) Local Calculation

**Location:** `Main/.venv/main.py`

```python
# Python app tracks:
1. Entry Time (First Detection):
   - When vehicle first detected at entry camera
   - Stored in vehicle_tracking dictionary
   
2. Last Seen Time:
   - Updates every time same plate detected
   - Shows vehicle is still present

3. Local Duration (UI Display):
   - Calculated from Entry Time to Now
   - Updates every 30 seconds via QTimer
   
4. Booking Duration (from Backend):
   - Received from API response
   - Shows booking-based duration
   - Updates on each detection
```

### Duration Display Locations

#### 1. Python ALPR Application GUI

**Vehicle Information Panel:**
```
┌─────────────────────────────────────┐
│  🚗 Vehicle: KA01AB1234             │
│                                     │
│  Entry Time: 14:30:15              │
│  Last Seen: 16:45:30               │
│                                     │
│  ⏱️ Stay Duration: 2h 15m          │
│  ⏳ Remaining: 30m                 │
│  ⚠️ Overstayed by: 0h 0m          │
└─────────────────────────────────────┘
```

**Booking Details Panel:**
```
┌─────────────────────────────────────┐
│  📋 Booking Status: ACTIVE          │
│                                     │
│  Start: 14:00:00                    │
│  End: 17:00:00                      │
│  Amount: ₹500.00                    │
│                                     │
│  Status: Within Booking Period ✅   │
│  OR                                 │
│  Status: OVERSTAYED ⚠️              │
└─────────────────────────────────────┘
```

#### 2. Activity Log

```
[14:30:15] 📋 Processing new plate: KA01AB1234
[14:30:16] ✅ Plate sent to backend successfully
[14:30:17] ✅ Booking found: Duration 0h 0m, Remaining 2h 30m
[16:45:00] 📋 Processing plate: KA01AB1234 (update)
[16:45:01] ⚠️ Vehicle OVERSTAYED by 0h 15m
```

---

## Overstay Detection & Display

### When Overstay is Detected

#### Backend Detection (Automatic)

**Trigger:** Every time a plate is detected (at entry OR exit)

**Logic:**
```typescript
const now = new Date()
const endTime = new Date(booking.endtime)

if (now > endTime) {
  // VEHICLE HAS OVERSTAYED
  isOverstayed = true
  
  // Calculate overstay duration
  overstayMinutes = Math.floor(
    (now.getTime() - endTime.getTime()) / (1000 * 60)
  )
}
```

**Response:**
```json
{
  "duration": {
    "isWithinBooking": false,
    "isOverstayed": true,
    "minutes": 180,        // Total time since booking start
    "remainingMinutes": -30,  // Negative = overstayed
    ...
  }
}
```

#### Frontend Display (Python App)

**Visual Indicators:**

1. **Booking Details Panel Color:**
   - 🟢 Green: Within booking period
   - 🟠 Orange: OVERSTAYED

2. **Status Text:**
   ```
   Status: OVERSTAYED by 0h 30m
   ```

3. **Activity Log:**
   ```
   [16:45:01] ⚠️ Vehicle OVERSTAYED by 0h 30m
   ```

4. **Vehicle Info Panel:**
   ```
   ⚠️ Overstayed by: 0h 30m
   ```

### Overstay Detection Points

#### Entry Camera:
- Detects vehicle entering
- Checks if booking exists
- Calculates if already overstayed before entry
- Displays overstay status immediately

#### Exit Camera:
- Detects vehicle leaving
- Final overstay calculation
- Shows total overstay duration
- Can trigger overstay charge calculation

---

## MongoDB Integration Flow

### Database Query Pattern

**IMPORTANT:** The system does NOT continuously poll MongoDB. It queries **on-demand** when a plate is detected.

#### Query Flow:

```
Plate Detected (Entry/Exit Camera)
    ↓
HTTP POST to /api/plate
    ↓
Backend Receives Request
    ↓
await connectToDB()  // Connect if not connected
    ↓
const booking = await BookingModel.findOne({
  plate: plate.toLowerCase(),
  status: BookingStatus.BOOKED
})
    ↓
MongoDB Returns Booking Document
    ↓
Backend Calculates Duration/Overstay
    ↓
Returns JSON Response
    ↓
Python App Updates UI
```

### MongoDB Schema

#### Booking Collection:
```javascript
{
  _id: ObjectId("..."),
  locationid: ObjectId("..."),
  userid: "user_xxx",
  bookingdate: ISODate("2024-12-08T00:00:00Z"),
  starttime: ISODate("2024-12-08T14:00:00Z"),  // Booking start
  endtime: ISODate("2024-12-08T17:00:00Z"),    // Booking end
  plate: "KA01AB1234",
  amount: 500.00,  // Original booking amount
  status: "BOOKED", // BOOKED, PENDING, CANCELLED
  timeoffset: -330,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Key Points:

1. **No Continuous Polling:**
   - MongoDB is queried only when plate is detected
   - No background polling threads
   - Event-driven architecture

2. **Query Efficiency:**
   - Single query per detection
   - Indexed on `plate` field (should be indexed)
   - Returns only active bookings (`status: BOOKED`)

3. **Real-time Accuracy:**
   - Each detection gets fresh data from MongoDB
   - Duration calculated in real-time
   - No stale cache issues

---

## Charge Calculation System

### Current System Behavior

#### 1. Initial Booking Charge

**When:** User books parking spot through web interface

**Location:** `app/(guest)/book/[locationId]/page.tsx`

```typescript
// Calculate booking amount
const diffInHours = differenceInMinutes(endTime, startTime) / 60
const amount = diffInHours * location.price.hourly

// Example:
// 3 hours × ₹100/hour = ₹300
```

**Stored in MongoDB:**
```javascript
{
  amount: 300.00,  // Fixed at booking time
  starttime: "2024-12-08T14:00:00",
  endtime: "2024-12-08T17:00:00"
}
```

#### 2. Overstay Charge Calculation

**CURRENT STATUS:** ⚠️ **NOT AUTOMATICALLY CALCULATED**

The system currently:
- ✅ **Detects** overstay
- ✅ **Displays** overstay duration
- ❌ **Does NOT** automatically calculate charges
- ❌ **Does NOT** bill customer automatically

### How Overstay Charges SHOULD Work (Future Enhancement)

#### Proposed Calculation:

```typescript
// In /api/plate route, when isOverstayed = true:

const overstayMinutes = Math.floor(
  (now.getTime() - booking.endtime.getTime()) / (1000 * 60)
)

const overstayHours = Math.ceil(overstayMinutes / 60)  // Round up

// Get location pricing
const location = await ParkingLocationModel.findById(booking.locationid)
const overstayRate = location.price.hourly * 1.5  // 50% penalty
// OR
const overstayRate = location.price.hourly  // Same rate

const overstayCharge = overstayHours * overstayRate

// Store overstay charge (need new field in Booking schema)
booking.overstayMinutes = overstayMinutes
booking.overstayCharge = overstayCharge
booking.totalAmount = booking.amount + overstayCharge
await booking.save()
```

### Where Charges Are Displayed

#### Current (Initial Booking Only):

1. **Booking Confirmation Page:**
   - Shows original booking amount
   - No overstay charge shown

2. **Dashboard Bookings View:**
   - Shows booking amount paid
   - No overstay tracking

3. **Python ALPR App:**
   - Shows booking amount
   - Shows overstay duration
   - Does NOT show overstay charge

#### Future Enhancement Needed:

1. **Python ALPR App:**
   ```
   ┌─────────────────────────────────────┐
   │  ⚠️ OVERSTAYED                      │
   │                                     │
   │  Original Amount: ₹300.00          │
   │  Overstay: 1h 30m                  │
   │  Overstay Charge: ₹150.00          │
   │  Total Amount: ₹450.00             │
   └─────────────────────────────────────┘
   ```

2. **Backend Response:**
   ```json
   {
     "duration": {
       "isOverstayed": true,
       "overstayMinutes": 90,
       "overstayCharge": 150.00,
       "totalAmount": 450.00
     }
   }
   ```

---

## Real-time Updates Mechanism

### Update Frequency

#### 1. Detection-Based Updates (Primary)

**Trigger:** Every time a plate is detected

**Frequency:** Variable (depends on traffic)
- High traffic: Every few seconds
- Low traffic: Minutes between detections

**What Updates:**
- ✅ Booking status from MongoDB
- ✅ Duration calculation
- ✅ Overstay status
- ✅ UI display

#### 2. Timer-Based Updates (Secondary)

**Location:** Python App (`Main/.venv/main.py`)

**Mechanism:**
```python
# QTimer updates duration display every 30 seconds
self.update_timer = QTimer()
self.update_timer.timeout.connect(self.update_duration_display)
self.update_timer.start(30000)  # 30 seconds
```

**What Updates:**
- ✅ Local duration (entry time to now)
- ✅ Remaining time display
- ✅ Overstay duration display
- ❌ Does NOT query MongoDB (uses cached data)

### Update Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│              ENTRY CAMERA                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Camera Feed (Continuous)                                │
│      ↓                                                    │
│  Plate Detected (Event)                                  │
│      ↓                                                    │
│  Send API Request                                        │
│      ↓                                                    │
│  Backend Queries MongoDB                                 │
│      ↓                                                    │
│  Returns Duration/Overstay Data                         │
│      ↓                                                    │
│  Update UI Display                                       │
│      ↓                                                    │
│  QTimer Updates Duration Every 30s                      │
│      ↓                                                    │
│  (Local calculation only, no MongoDB query)             │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              EXIT CAMERA                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Camera Feed (Continuous)                                │
│      ↓                                                    │
│  Plate Detected (Event)                                  │
│      ↓                                                    │
│  Send API Request                                        │
│      ↓                                                    │
│  Backend Queries MongoDB                                 │
│      ↓                                                    │
│  Calculates Final Overstay                              │
│      ↓                                                    │
│  Returns Overstay Status                                │
│      ↓                                                    │
│  Update UI Display                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow Diagram

### Full System Flow: Entry to Exit with Overstay

```
┌──────────────────────────────────────────────────────────────────┐
│                     VEHICLE ENTERS PARKING                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│           ENTRY CAMERA DETECTS PLATE                              │
│           Plate: "KA01AB1234"                                     │
│           Time: 14:30:00                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Python App (Entry Camera)            │
        │  - Validates plate                    │
        │  - Checks cooldown                    │
        │  - Records entry_time = 14:30:00      │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  HTTP POST /api/plate                 │
        │  {                                    │
        │    "plate": "KA01AB1234",             │
        │    "address": "Main Gate Entry",      │
        │    "locationId": "entry-gate-1"       │
        │  }                                    │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Backend Server                       │
        │  - Receives request                   │
        │  - Connects to MongoDB                │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  MongoDB Query                        │
        │  BookingModel.findOne({               │
        │    plate: "ka01ab1234",               │
        │    status: "BOOKED"                   │
        │  })                                   │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Booking Found:                       │
        │  {                                    │
        │    starttime: "14:00:00",             │
        │    endtime: "17:00:00",               │
        │    amount: 300.00                     │
        │  }                                    │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Calculate Duration                   │
        │  now = 14:30:00                       │
        │  duration = 30 minutes                │
        │  remaining = 2h 30m                   │
        │  isOverstayed = false                 │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Return Response                      │
        │  {                                    │
        │    "hasBooking": true,                │
        │    "duration": {                      │
        │      "minutes": 30,                   │
        │      "remainingMinutes": 150,         │
        │      "isOverstayed": false            │
        │    }                                  │
        │  }                                    │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Python App Updates UI                │
        │  - Shows booking status               │
        │  - Displays duration                  │
        │  - Shows remaining time               │
        └───────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│           VEHICLE PARKED (Time Passes)                            │
│           Timer Updates Every 30s (Local Only)                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│           BOOKING TIME EXPIRES                                    │
│           End Time: 17:00:00                                      │
│           Current Time: 17:01:00                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│           EXIT CAMERA DETECTS PLATE                               │
│           Plate: "KA01AB1234"                                     │
│           Time: 17:15:00                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  HTTP POST /api/plate                 │
        │  {                                    │
        │    "plate": "KA01AB1234",             │
        │    "address": "Main Gate Exit",       │
        │    "locationId": "exit-gate-1"        │
        │  }                                    │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  MongoDB Query                        │
        │  (Same booking found)                 │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Calculate Overstay                   │
        │  now = 17:15:00                       │
        │  endtime = 17:00:00                   │
        │  overstay = 15 minutes                │
        │  isOverstayed = true                  │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Return Response                      │
        │  {                                    │
        │    "duration": {                      │
        │      "isOverstayed": true,            │
        │      "minutes": 195,                  │
        │      "remainingMinutes": -15          │
        │    }                                  │
        │  }                                    │
        └───────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        │  Python App (Exit Camera)             │
        │  - Shows OVERSTAYED status            │
        │  - Displays overstay duration         │
        │  - Logs overstay event                │
        │  ⚠️  Does NOT calculate charge        │
        └───────────────────────────────────────┘
```

---

## Configuration Summary

### Entry Camera `.env`:
```env
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=your_app_key
LOCATION=Main Gate Entry
LOCATION_ID=entry-gate-1
CAMERA_ID=camera-entry-1
```

### Exit Camera `.env`:
```env
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=your_app_key
LOCATION=Main Gate Exit
LOCATION_ID=exit-gate-1
CAMERA_ID=camera-exit-1
```

---

## Key Takeaways

1. **MongoDB Queries:**
   - ❌ NOT continuously polled
   - ✅ Queried on-demand when plate detected
   - ✅ Fresh data on every detection

2. **Duration Updates:**
   - ✅ Real-time calculation on each detection
   - ✅ Local timer updates every 30s (display only)
   - ✅ No stale data issues

3. **Overstay Detection:**
   - ✅ Automatic on every detection
   - ✅ Calculated by comparing `now` vs `booking.endtime`
   - ✅ Displayed in Python app UI
   - ❌ Charges NOT automatically calculated (manual process)

4. **Charge Calculation:**
   - ✅ Initial booking: Calculated at booking time
   - ❌ Overstay charges: NOT automatically calculated
   - ⚠️  Enhancement needed for automatic overstay billing

---

## Next Steps / Enhancements Needed

1. **Automatic Overstay Charge Calculation:**
   - Add `overstayCharge` field to Booking schema
   - Calculate charge when `isOverstayed = true`
   - Store in MongoDB
   - Display in UI

2. **Billing Integration:**
   - Charge customer automatically via Stripe
   - Send overstay invoice email
   - Update booking with overstay amount

3. **Continuous Monitoring (Optional):**
   - Add periodic checks for parked vehicles
   - Alert if vehicle overstayed > threshold
   - Automated notifications

---

**Last Updated:** 2024-12-08
**Version:** 1.0

