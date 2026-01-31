# Fix Google OAuth Redirect URI Mismatch

## Quick Fix Steps

### 1. Check Your Current Redirect URI

Your code uses: `${window.location.origin}/auth/google/callback`

**For development (localhost):**
```
http://localhost:5173/auth/google/callback
```

**For production:**
```
https://yourdomain.com/auth/google/callback
```

### 2. Add to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (the one with Client ID: `376321405548-59v2n1j84k2v06peurm4uj7uk022hf55`)
5. Under **Authorized redirect URIs**, click **+ ADD URI**
6. Add **EXACTLY** this URI (copy-paste to avoid typos):
   ```
   http://localhost:5173/auth/google/callback
   ```
7. Click **SAVE**

### 3. Important Notes

- **No trailing slash** - Don't add `/` at the end
- **Exact match required** - Must match character-for-character
- **Case sensitive** - `localhost` not `Localhost`
- **Protocol matters** - `http://` not `https://` for localhost
- **Port number matters** - Must be `5173` (or whatever port your dev server uses)

### 4. Verify Your Setup

After adding the URI, wait a few seconds for Google to update, then try signing in again.

### 5. Common Mistakes to Avoid

❌ `http://localhost:5173/auth/google/callback/` (trailing slash)
❌ `http://localhost:3000/auth/google/callback` (wrong port)
❌ `https://localhost:5173/auth/google/callback` (wrong protocol for localhost)
❌ `http://127.0.0.1:5173/auth/google/callback` (use localhost, not 127.0.0.1)
❌ `http://localhost:5173/` (missing callback path)

✅ `http://localhost:5173/auth/google/callback` (correct!)

### 6. For Production

When you deploy, add your production redirect URI:
```
https://yourdomain.com/auth/google/callback
```

Make sure to:
- Use `https://` (not `http://`)
- Use your actual domain name
- No trailing slash

## Testing

After adding the redirect URI:
1. Wait 1-2 minutes for Google to update
2. Clear your browser cache/cookies for Google
3. Try signing in again

If it still doesn't work, check the browser console for the exact redirect URI being sent and make sure it matches exactly what you added in Google Cloud Console.

