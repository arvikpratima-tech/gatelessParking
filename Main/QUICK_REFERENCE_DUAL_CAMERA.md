# Quick Reference - Dual Camera & Overstay System

## 🚀 Quick Start: Running Both Cameras

### Step 1: Start Backend
```bash
npm run dev
# Runs on http://localhost:3000
```

### Step 2: Start Entry Camera
```bash
cd Main/.venv
.\Scripts\python.exe main.py
# OR use: start-entry-camera.bat
```

### Step 3: Start Exit Camera (Separate Window)
```bash
# Open new terminal
cd Main/.venv
.\Scripts\python.exe main.py
# OR use: start-exit-camera.bat
```

---

## 📍 Where Overstay is Shown

### 1. Python ALPR Application GUI

**Vehicle Information Panel:**
```
⚠️ Overstayed by: 0h 30m
```

**Booking Details Panel:**
```
⚠️ OVERSTAYED
Status: Orange background
```

**Activity Log:**
```
[16:45:01] ⚠️ Vehicle OVERSTAYED by 0h 30m
```

### 2. Backend API Response

When plate detected, response includes:
```json
{
  "duration": {
    "isOverstayed": true,
    "minutes": 195,
    "remainingMinutes": -15,
    ...
  }
}
```

---

## 🔄 How System Works

### MongoDB Query Pattern

**IMPORTANT:** System does NOT continuously poll MongoDB.

**Query happens:**
- ✅ When plate is detected (Entry or Exit)
- ✅ On-demand, event-driven
- ✅ Fresh data every time

**What happens:**
```
Plate Detected
    ↓
Send API Request
    ↓
Backend Queries MongoDB
    ↓
Calculates Duration/Overstay
    ↓
Returns Response
    ↓
Python App Updates UI
```

### Duration Updates

1. **Detection-Based (Primary):**
   - Every time plate detected
   - Queries MongoDB
   - Calculates fresh duration/overstay

2. **Timer-Based (Secondary):**
   - Every 30 seconds
   - Local calculation only (no MongoDB query)
   - Updates display only

---

## ⏱️ Duration Calculation

### Backend Calculation (Real-time)

**Location:** `app/api/plate/route.ts`

```typescript
// When plate detected:
const now = new Date()
const startTime = booking.starttime
const endTime = booking.endtime

// Calculate duration
durationMinutes = (now - startTime) / 60

// Calculate remaining
remainingMinutes = (endTime - now) / 60

// Check overstay
isOverstayed = now > endTime
```

### Display Locations

**Python App:**
- Vehicle Info Panel: Shows entry time, last seen
- Booking Panel: Shows booking times, overstay status
- Duration Label: Shows stay duration, remaining, overstay

---

## 💰 Charge Calculation

### Current Status

**Initial Booking:**
- ✅ Calculated at booking time
- ✅ Stored in MongoDB
- ✅ Charged via Stripe

**Overstay Charges:**
- ✅ Overstay is DETECTED
- ✅ Overstay duration is DISPLAYED
- ❌ Overstay charge is NOT calculated automatically
- ❌ Customer is NOT billed automatically

### How to Calculate Overstay Charge (Manual)

```typescript
// Overstay minutes
const overstayMinutes = Math.floor(
  (now.getTime() - booking.endtime.getTime()) / (1000 * 60)
)

// Overstay hours (round up)
const overstayHours = Math.ceil(overstayMinutes / 60)

// Get location hourly rate
const location = await ParkingLocationModel.findById(booking.locationid)
const hourlyRate = location.price.hourly

// Calculate charge (with 50% penalty)
const overstayCharge = overstayHours * hourlyRate * 1.5

// OR same rate
const overstayCharge = overstayHours * hourlyRate
```

---

## 📊 Complete Flow Example

### Scenario: Vehicle Parks and Overstays

```
14:00:00 - Booking Start
    ↓
14:30:00 - Entry Camera Detects Vehicle
    - Queries MongoDB
    - Duration: 30 minutes
    - Remaining: 2h 30m
    - Status: ✅ Within Booking
    ↓
17:00:00 - Booking End Time
    ↓
17:15:00 - Exit Camera Detects Vehicle
    - Queries MongoDB
    - Duration: 3h 15m
    - Overstay: 15 minutes
    - Status: ⚠️ OVERSTAYED
    ↓
Python App Shows:
    - "⚠️ Overstayed by: 0h 15m"
    - Orange background
    - Logged in Activity Log
```

---

## 🔧 Configuration Files

### Entry Camera `.env`:
```env
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=your_key
LOCATION=Main Gate Entry
LOCATION_ID=entry-gate-1
CAMERA_ID=camera-entry-1
```

### Exit Camera `.env`:
```env
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=your_key
LOCATION=Main Gate Exit
LOCATION_ID=exit-gate-1
CAMERA_ID=camera-exit-1
```

---

## 🎯 Key Points

1. **MongoDB:** Queried on-demand, NOT continuously polled
2. **Duration:** Calculated real-time on each detection
3. **Overstay:** Detected automatically, displayed immediately
4. **Charges:** Overstay charges NOT auto-calculated (enhancement needed)
5. **Updates:** Every 30s timer (local only), real-time on detection

---

## 📚 Full Documentation

- **Dual Camera Setup:** `DUAL_CAMERA_SETUP_GUIDE.md`
- **System Architecture:** `SYSTEM_ARCHITECTURE_GUIDE.md`
- **User Guide:** `USER_GUIDE.md`
- **Quick Start:** `QUICK_START.md`






