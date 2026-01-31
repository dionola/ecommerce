# Fix Google OAuth Redirect URI Mismatch Error

## The Problem

You're getting `Error 400: redirect_uri_mismatch` because the redirect URI in your code doesn't match what's configured in Google Cloud Console.

## The Exact Redirect URI You Need

Your code uses: `${window.location.origin}/auth/google/callback`

**For development (localhost:5173):**
```
http://localhost:5173/auth/google/callback
```

**For production:**
```
https://yourdomain.com/auth/google/callback
```

## Step-by-Step Fix

### 1. Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one with Client ID: `376321405548-59v2n1j84k2v06peurm4uj7uk022hf55`)
5. Click on it to edit

### 2. Add the Redirect URI

1. Scroll down to **Authorized redirect URIs**
2. Click **+ ADD URI**
3. **Copy and paste this EXACT URI** (no trailing slash, exact match):
   ```
   http://localhost:5173/auth/google/callback
   ```
4. Click **SAVE**

### 3. Wait and Test

1. Wait 1-2 minutes for Google to update
2. Clear your browser cache/cookies (or use incognito mode)
3. Try signing in with Google again

## Common Mistakes

❌ **Wrong:** `http://localhost:5173/auth/google/callback/` (trailing slash)
✅ **Correct:** `http://localhost:5173/auth/google/callback`

❌ **Wrong:** `http://localhost:3000/auth/google/callback` (wrong port)
✅ **Correct:** `http://localhost:5173/auth/google/callback` (your dev server port)

❌ **Wrong:** `https://localhost:5173/auth/google/callback` (https for localhost)
✅ **Correct:** `http://localhost:5173/auth/google/callback` (http for localhost)

❌ **Wrong:** `http://127.0.0.1:5173/auth/google/callback` (use localhost, not 127.0.0.1)
✅ **Correct:** `http://localhost:5173/auth/google/callback`

## Verify Your Port

If your dev server runs on a different port, update the URI accordingly:
- Port 3000: `http://localhost:3000/auth/google/callback`
- Port 5174: `http://localhost:5174/auth/google/callback`
- Port 5173: `http://localhost:5173/auth/google/callback` (default Vite port)

## Debug: Check What URI Is Being Sent

If it still doesn't work, check the browser console or network tab to see the exact redirect URI being sent. It should match exactly what you added in Google Cloud Console.

## For Production

When you deploy, add your production redirect URI:
```
https://yourdomain.com/auth/google/callback
```

Make sure to:
- Use `https://` (not `http://`)
- Use your actual domain name
- No trailing slash

