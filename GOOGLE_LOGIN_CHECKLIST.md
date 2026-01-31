# Google Login Setup Checklist

Quick reference guide for setting up Google sign-in using Google SDK only (no Cognito OAuth).

## Required Changes

### 1. Google Cloud Console Setup

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create a new project or select existing one
- [ ] Configure OAuth consent screen:
  - User Type: **External**
  - App name: Your app name
  - User support email: Your email
  - Developer contact: Your email
- [ ] Create OAuth Client ID:
  - Application type: **Web application**
  - **Authorized JavaScript origins**: 
    - `http://localhost:5173`
    - `https://yourdomain.com` (for production)
  - **Authorized redirect URIs**: 
    - `http://localhost:5173/auth/google/callback`
    - `https://yourdomain.com/auth/google/callback` (for production)
- [ ] **Copy the Client ID** (you'll need this)

### 2. Environment Variables

Add to `client/.env`:
```env
VITE_GOOGLE_CLIENT_ID=376321405548-59v2n1j84k2v06peurm4uj7uk022hf55.apps.googleusercontent.com
```

Add to `server/.env`:
```env
GOOGLE_CLIENT_ID=376321405548-59v2n1j84k2v06peurm4uj7uk022hf55.apps.googleusercontent.com
```

**Note**: The client secret is not needed for this implementation. We only use the client ID to verify Google ID tokens.

**Note**: You should already have these from your existing Cognito setup:
```env
VITE_AWS_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_AWS_COGNITO_CLIENT_ID=your-app-client-id
VITE_AWS_REGION=us-east-1
```

### 3. Install Backend Dependencies

- [ ] Run `cd server && npm install` to install `google-auth-library`

### 4. Test

- [ ] Restart both frontend and backend dev servers (to load new env variables)
- [ ] Click "Sign In" → "Continue with Google"
- [ ] Should see Google sign-in prompt
- [ ] After signing in, should be logged in without any redirects

## Quick Reference

**Google Cloud Console**: https://console.cloud.google.com/
- Get Client ID here

**Environment Variables Needed**:
- `VITE_GOOGLE_CLIENT_ID` (frontend) - From Google Cloud Console
- `GOOGLE_CLIENT_ID` (backend) - Same value as frontend

## Troubleshooting

**"Google Client ID is not configured"**
→ Check `VITE_GOOGLE_CLIENT_ID` in `client/.env` and `GOOGLE_CLIENT_ID` in `server/.env`
→ Restart both dev servers

**Google popup doesn't appear**
→ Check browser console for errors
→ Verify Google Client ID is correct
→ Check authorized JavaScript origins in Google Cloud Console

**"Invalid Google token" error**
→ Verify `GOOGLE_CLIENT_ID` in `server/.env` matches the Client ID from Google Cloud Console
→ Check backend logs for detailed error messages

**User not created in database**
→ Check backend logs for user creation errors
→ Verify database connection is working

## What's Already Done

✅ Frontend code is implemented
✅ Google Identity Services SDK integration (no Cognito OAuth)
✅ Backend Google token verification
✅ Auth middleware accepts both Cognito and Google tokens
✅ User creation in database
✅ UI components (Google sign-in button)

You just need to:
1. Configure Google Cloud Console
2. Add environment variables
3. Install backend dependencies
