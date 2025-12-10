# Timeout Issue Fix

## Problem
Getting timeout errors when connecting to Vercel backend:
```
HTTPSConnectionPool(host='a-gateless-parking-management-system.vercel.app', port=443): Read timed out. (read timeout=10)
```

## Solution Applied

### 1. Increased Default Timeout
- **Before:** 10 seconds
- **After:** 30 seconds
- **Reason:** Vercel serverless functions can have cold starts that take 10-20 seconds

### 2. Added Retry Logic
- **Retries:** 2 additional attempts (3 total)
- **Retry Delay:** 2 seconds between retries
- **Smart Retry:** Only retries on timeout and connection errors, not on 4xx client errors

### 3. Better Error Handling
- Specific handling for timeout errors
- Logs retry attempts
- Clearer error messages

## Configuration

The following environment variables can be set in `.env`:

```env
REQUEST_TIMEOUT=30        # Timeout in seconds (default: 30)
REQUEST_RETRIES=2         # Number of retries (default: 2)
RETRY_DELAY=2             # Delay between retries in seconds (default: 2)
```

## How It Works

1. **First Attempt:** Sends request with 30-second timeout
2. **On Timeout:** Waits 2 seconds, then retries
3. **Second Attempt:** Another 30-second timeout
4. **On Timeout:** Waits 2 seconds, then final retry
5. **Third Attempt:** Final attempt with 30-second timeout
6. **If All Fail:** Reports error to user

## Why Vercel Times Out

Vercel uses serverless functions that:
- Can have **cold starts** (first request after inactivity)
- May take 10-20 seconds to initialize
- Subsequent requests are much faster (warm functions)

## Testing

After restarting the application:
1. First request may still timeout (cold start)
2. Retry should succeed
3. Subsequent requests should be fast

## Next Steps

1. ✅ Restart the application to load new timeout settings
2. ✅ Test with a plate detection
3. ✅ Check logs for retry attempts
4. ✅ Verify successful connection after retries

The application will now handle Vercel cold starts much better!

