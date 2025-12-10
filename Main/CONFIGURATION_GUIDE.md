# Configuration Guide for Vercel Backend

## Backend API Configuration

Your application is now configured to communicate with:
**http://localhost:3000/**

## Environment Variables Setup

Create or update your `.env` file in `Main/.venv/` directory with the following:

```env
# Backend API Configuration
BACKEND_API=http://localhost:3000/api/plate
APP_KEY=your_app_key_here
LOCATION=Your Parking Location Name
LOCATION_ID=optional_location_id
CAMERA_ID=optional_camera_id
```

## API Endpoint Details

### Default Endpoint
- **URL:** `http://localhost:3000/api/plate`
- **Method:** POST
- **Authentication:** Token-based (via `APP_KEY`)

### Request Format
```json
{
  "plate": "ABC123",
  "address": "Location Name",
  "timestamp": "2024-01-15T10:30:00",
  "locationId": "optional",
  "cameraId": "optional"
}
```

### Response Format (with booking)
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

### Response Format (violation - no booking)
```json
{
  "message": "violation",
  "hasBooking": false
}
```

## Verification

### Test API Connection

You can test the API connection using curl:

```bash
curl -X POST http://localhost:3000/api/plate \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_APP_KEY" \
  -d '{
    "plate": "TEST123",
    "address": "Test Location",
    "timestamp": "2024-01-15T10:30:00"
  }'
```

### Check Configuration in Application

1. Run the application:
   ```bash
   cd Main\.venv
   .\Scripts\python.exe main.py
   ```

2. The application will use:
   - `BACKEND_API` from `.env` file if set
   - Default: `http://localhost:3000/api/plate` if not set

3. Check the log output - it will show which endpoint is being used

## Important Notes

1. **HTTPS Required:** The Vercel domain uses HTTPS, which is required for secure communication
2. **CORS:** Make sure your Vercel deployment allows requests from your local machine
3. **APP_KEY:** You must set the `APP_KEY` environment variable to match your backend's `APP_KEY`
4. **Endpoint Path:** The endpoint is `/api/plate` (no trailing slash in default)

## Troubleshooting

### Connection Issues

If you're having connection issues:

1. **Check Network:** Ensure you can access the Vercel URL in a browser
2. **Check APP_KEY:** Verify your `APP_KEY` matches the backend configuration
3. **Check Logs:** Look at the application log for detailed error messages
4. **Test Endpoint:** Use curl or Postman to test the API directly

### Common Errors

- **401 Unauthorized:** Check your `APP_KEY` is correct
- **404 Not Found:** Verify the endpoint URL is correct
- **Connection Timeout:** Check your internet connection and firewall settings
- **SSL Certificate Error:** Ensure your system trusts the Vercel SSL certificate

## Code Changes Made

The default API endpoint has been updated in `main.py`:

**Before:**
```python
api_endpoint: str = os.getenv("BACKEND_API", "http://localhost:3000/api/plate/")
```

**After:**
```python
api_endpoint: str = os.getenv("BACKEND_API", "http://localhost:3000/api/plate")
```

This ensures that even if `BACKEND_API` is not set in `.env`, the application will use your Vercel deployment.

