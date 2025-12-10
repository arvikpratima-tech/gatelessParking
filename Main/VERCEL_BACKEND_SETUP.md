# Vercel Backend Configuration

## ✅ Configuration Updated

The application has been configured to communicate with your Vercel deployment:
**https://a-gateless-parking-management-system.vercel.app/**

## Current Configuration

### Default API Endpoint
The default API endpoint in `main.py` has been updated to:
```python
api_endpoint: str = os.getenv("BACKEND_API", "https://a-gateless-parking-management-system.vercel.app/api/plate")
```

### Environment Variable Override
If you have a `.env` file, you can override this by setting:
```env
BACKEND_API=https://a-gateless-parking-management-system.vercel.app/api/plate
```

## Required Environment Variables

Create or update `Main/.venv/.env` file:

```env
# Required: Backend API URL
BACKEND_API=https://a-gateless-parking-management-system.vercel.app/api/plate

# Required: Authentication token (must match your Vercel backend APP_KEY)
APP_KEY=your_app_key_here

# Optional: Location information
LOCATION=Your Parking Location Name
LOCATION_ID=optional_location_id
CAMERA_ID=optional_camera_id
```

## API Endpoint Details

- **Base URL:** `https://a-gateless-parking-management-system.vercel.app`
- **API Endpoint:** `/api/plate`
- **Full URL:** `https://a-gateless-parking-management-system.vercel.app/api/plate`
- **Method:** POST
- **Authentication:** Token-based via `Authorization: Token <APP_KEY>` header

## Testing the Connection

### Option 1: Use the Test Script
```bash
cd Main\.venv
.\Scripts\python.exe test_api_connection.py
```

This will:
- Check your configuration
- Test the API connection
- Verify authentication
- Show response details

### Option 2: Test from Application
1. Run the application:
   ```bash
   cd Main\.venv
   .\Scripts\python.exe main.py
   ```

2. Use "Upload Image" button to test with an image
3. Check the Activity Log for API responses
4. Verify vehicle information is displayed

### Option 3: Manual Test with curl
```bash
curl -X POST https://a-gateless-parking-management-system.vercel.app/api/plate \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_APP_KEY" \
  -d '{
    "plate": "TEST123",
    "address": "Test Location",
    "timestamp": "2024-01-15T10:30:00"
  }'
```

## Verification Checklist

- [x] Default API endpoint updated in code
- [ ] `.env` file created/updated with `BACKEND_API`
- [ ] `APP_KEY` set in `.env` (matches Vercel backend)
- [ ] API connection tested successfully
- [ ] Application can send plate detections
- [ ] Booking information is received
- [ ] Duration calculations work

## Important Notes

1. **HTTPS Required:** The Vercel domain uses HTTPS - ensure your system trusts the SSL certificate
2. **APP_KEY Security:** Keep your `APP_KEY` secure and never commit it to version control
3. **CORS:** Your Vercel deployment should allow requests from your local machine
4. **Endpoint Path:** The endpoint is `/api/plate` (no trailing slash)

## Troubleshooting

### Issue: Still connecting to localhost
**Solution:** Check your `.env` file - if `BACKEND_API` is set to localhost, it will override the default. Update it to the Vercel URL.

### Issue: 401 Unauthorized
**Solution:** Verify your `APP_KEY` in `.env` matches the `APP_KEY` in your Vercel environment variables.

### Issue: Connection Timeout
**Solution:** 
- Check internet connection
- Verify Vercel deployment is live: https://a-gateless-parking-management-system.vercel.app/
- Check firewall settings

### Issue: 404 Not Found
**Solution:** Verify the endpoint path is correct: `/api/plate` (not `/api/plate/`)

## Code Changes Summary

**File:** `Main/.venv/main.py`
**Line:** 69
**Change:** Updated default API endpoint from `http://localhost:3000/api/plate/` to `https://a-gateless-parking-management-system.vercel.app/api/plate`

All API communication now uses your Vercel deployment by default!

