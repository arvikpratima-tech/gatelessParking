# 🔧 Fix: Hardcoded Google Maps API Key Issue

## The Problem

Your console shows this API key being used:
```
AIzaSyBFQDH_KmNznrIXkBdu24-g1_iZcQ5SGAQ
```

This means **your Vercel environment variable has the wrong key** (likely an old example key).

## ⚠️ Critical: Check Vercel Environment Variables

### Step 1: Go to Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in and select your project: **A-Gateless-Parking-Management-System**
3. Go to **Settings** → **Environment Variables**

### Step 2: Check the API Key Value

1. Look for `NEXT_PUBLIC_MAPS_API_KEY`
2. Check what value is currently set
3. **If it shows** `AIzaSyBFQDH_KmNznrIXkBdu24-g1_iZcQ5SGAQ` **or any other hardcoded key**, that's the problem!

### Step 3: Update the API Key

1. Click on `NEXT_PUBLIC_MAPS_API_KEY` to edit
2. **Delete the old value** (the hardcoded key)
3. **Enter your actual Google Maps API key** (starts with `AIzaSy...` but different)
4. Make sure it's selected for:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click **Save**

### Step 4: Get Your Correct API Key

If you don't have a valid API key yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy the new API key
6. Configure it (see GOOGLE_MAPS_SETUP.md for details)

### Step 5: Configure the New API Key

**IMPORTANT:** After creating the API key in Google Cloud Console:

1. **Click on the API key** to edit it
2. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add these domains:
     ```
     localhost:3000
     localhost:3000/*
     *.vercel.app/*
     your-app-name.vercel.app/*
     your-custom-domain.com/*
     your-custom-domain.com/*
     ```
3. Under **API restrictions**:
   - Select **Restrict key**
   - Enable:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API (optional)
4. **Save** changes

### Step 6: Redeploy on Vercel

After updating the environment variable:

1. Go back to Vercel dashboard
2. Go to **Deployments**
3. Click **...** on the latest deployment
4. Click **Redeploy**
5. Wait for the deployment to complete

**OR** just push a new commit:
```bash
git commit --allow-empty -m "Trigger redeploy after API key update"
git push
```

## ✅ Verification

After redeploying:

1. Open your Vercel site
2. Open browser console (F12)
3. Check Network tab for Google Maps requests
4. The API key in the request URL should **NOT** be `AIzaSyBFQDH_KmNznrIXkBdu24-g1_iZcQ5SGAQ`
5. It should be your new API key

## 🚨 Common Mistakes

### ❌ Don't do this:
- Set environment variable to a hardcoded example key
- Use someone else's API key from a tutorial
- Forget to configure HTTP referrer restrictions
- Use an API key without billing enabled

### ✅ Do this:
- Use your own API key from Google Cloud Console
- Configure proper restrictions
- Enable billing (free $200/month credit)
- Update Vercel environment variables correctly

## 🔍 Quick Check

To verify your code is using the environment variable (not hardcoded):

1. Search your codebase: `grep -r "AIzaSy" .` (should find nothing except docs)
2. Check Vercel logs for environment variable usage
3. Check browser console for the API key in network requests

## Still Not Working?

If the error persists after fixing the Vercel environment variable:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Wait 5-10 minutes** for changes to propagate
3. **Check Google Cloud Console** for API quotas/errors
4. **Verify billing** is enabled
5. **Check API restrictions** in Google Cloud Console match your domain

