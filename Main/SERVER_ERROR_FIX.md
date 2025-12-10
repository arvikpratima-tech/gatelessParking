# Server Error 500 Fix

## Problem
Getting 500 server errors when sending plate detections:
```
Server error 500: 
```

## Root Cause
The backend API route (`app/api/plate/route.ts`) was missing the database connection call before trying to query the database.

## Solution Applied

### 1. Added Database Connection
Added `await connectToDB()` at the start of the POST handler to ensure database is connected before querying.

**Before:**
```typescript
export async function POST(req: Request) {
    try {
        const body = await req.json()
        // ... directly using BookingModel without connection
```

**After:**
```typescript
import { connectToDB } from "@/lib/db"

export async function POST(req: Request) {
    try {
        await connectToDB()  // Connect to database first
        const body = await req.json()
        // ... now safe to use BookingModel
```

### 2. Improved Error Handling
Changed error handling to return proper JSON error response instead of throwing:

**Before:**
```typescript
} catch(error) {
    console.log("Error: ", error)
    throw error  // This causes 500 with no details
}
```

**After:**
```typescript
} catch(error) {
    console.log("Error: ", error)
    return NextResponse.json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
}
```

### 3. Enhanced Client-Side Error Logging
Updated the Python client to:
- Show full error details from server
- Log request URL and payload for debugging
- Better error messages in the UI

## Files Modified

1. **Backend:** `app/api/plate/route.ts`
   - Added `connectToDB()` import and call
   - Improved error handling

2. **Frontend:** `Main/.venv/main.py`
   - Enhanced error logging
   - Better error message display

## Next Steps

1. **Deploy Backend Changes:**
   - Commit and push the changes to `app/api/plate/route.ts`
   - Deploy to Vercel
   - The database connection will now work properly

2. **Test Again:**
   - Restart the Python application (if needed)
   - Try detecting a plate
   - Should now get proper responses instead of 500 errors

## Expected Behavior After Fix

### With Valid Booking:
```json
{
  "message": "ok",
  "hasBooking": true,
  "booking": { ... },
  "duration": { ... }
}
```

### Without Booking (Violation):
```json
{
  "message": "violation",
  "hasBooking": false
}
```

### On Error (with details):
```json
{
  "message": "Internal server error",
  "error": "Error details here"
}
```

The 500 errors should now be resolved! 🎉

