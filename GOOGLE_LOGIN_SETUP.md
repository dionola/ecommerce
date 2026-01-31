# Google Login Setup with Google JavaScript SDK and Cognito

This guide explains how to configure Google sign-in using Google's JavaScript SDK directly with Cognito's OAuth endpoints. **No Amplify dependency for Google sign-in** - we use Cognito's REST APIs directly. The app uses Google Identity Services to get a Google ID token, then redirects to Cognito's OAuth endpoint which handles the token exchange.

## Prerequisites

- AWS Cognito User Pool already configured
- Access to AWS Cognito Console
- Google Cloud Console account

## Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Configure OAuth Consent Screen**
   - Navigate to **APIs & Services** > **OAuth consent screen**
   - User Type: **External**
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through the steps

3. **Create OAuth Client ID**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Name: Your app name (e.g., "E-commerce Store")
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:5173
     https://yourdomain.com
     ```
     - Add your development URL
     - Add your production URL when ready
   - **Authorized redirect URIs**: 
     ```
     https://YOUR_COGNITO_DOMAIN.auth.REGION.amazoncognito.com/oauth2/idpresponse
     http://localhost:5173/
     https://yourdomain.com/
     ```
     - Replace `YOUR_COGNITO_DOMAIN` with your Cognito domain
     - Replace `REGION` with your AWS region (e.g., `us-east-1`)
     - Example: `https://myapp.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
   - Click **Create**

4. **Save Credentials**
   - Copy the **Client ID** (you'll need this for the frontend)
   - Copy the **Client Secret** (you'll need this for Cognito)

## Step 2: Configure Google Identity Provider in Cognito

1. **Go to AWS Cognito Console**
   - Navigate to your User Pool
   - Click on the **Sign-in experience** tab

2. **Add Google as Identity Provider**
   - Under **Federated identity provider sign-in**, click **Add identity provider**
   - Select **Google** from the list

3. **Configure Google Provider**
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client secret**: Paste the Client Secret from Google Cloud Console
   - **Authorized scopes**: `openid email profile` (default is usually fine)
   - Click **Add identity provider**

## Step 3: Configure App Client Settings

1. **In your Cognito User Pool**, go to **App integration** tab

2. **Configure App Client**
   - Under **App clients**, select your app client
   - Click **Edit**

3. **Enable OAuth Settings**
   - Under **Hosted UI settings** (even though we're not using Hosted UI, we need OAuth enabled):
     - **Identity providers**: Check **Google** (in addition to Cognito user pool)
     - **Allowed callback URLs**: 
       ```
       http://localhost:5173/
       https://yourdomain.com/
       ```
       - Add your development URL
       - Add your production URL when ready
     - **Allowed sign-out URLs**: Same as callback URLs
       ```
       http://localhost:5173/
       https://yourdomain.com/
       ```
   - Click **Save changes**

## Step 4: Get Your Cognito Domain

1. **In your User Pool**, go to **App integration** tab
2. **Under Domain**, you'll see your Cognito domain:
   - Format: `YOUR_DOMAIN.auth.REGION.amazoncognito.com`
   - Or you can create a custom domain if preferred
   - **Copy this domain** - you'll need it for environment variables

## Step 5: Configure Environment Variables

Add the following to your `.env` file in the `client` directory:

```env
# Existing Cognito config (you should already have these)
VITE_AWS_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_AWS_COGNITO_CLIENT_ID=your-app-client-id
VITE_AWS_REGION=us-east-1

# Google OAuth config (NEW - add these)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-google-cloud-console
VITE_AWS_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
```

**Important Notes:**
- `VITE_GOOGLE_CLIENT_ID` is the Client ID from Google Cloud Console (not Cognito)
- `VITE_AWS_COGNITO_DOMAIN` is your Cognito domain
- No redirect URLs needed in env vars - they're handled programmatically

## Step 6: Test Google Login

1. **Start your development server**
   ```bash
   cd client
   npm run dev
   ```

2. **Test the flow**:
   - Click "Sign In" or "Create Account" button
   - Click "Continue with Google" button
   - A Google sign-in popup should appear (or inline prompt)
   - After signing in with Google, you'll be redirected to Cognito
   - Cognito will redirect back to your app
   - You should be automatically signed in

## How It Works

1. User clicks "Continue with Google"
2. Google Identity Services SDK loads and prompts for Google sign-in
3. User signs in with Google, receives Google ID token
4. App redirects to Cognito's OAuth authorization endpoint (`/oauth2/authorize`) with Google as identity provider
5. Cognito handles the OAuth flow with Google and redirects back with authorization code
6. App exchanges authorization code for Cognito tokens using Cognito's token endpoint (`/oauth2/token`) - **direct REST API call, no Amplify needed**
7. User is signed in with Cognito tokens

**Key Point**: This implementation uses Cognito's OAuth REST APIs directly. Amplify is only used for email/password authentication and token management. The Google sign-in flow is completely independent of Amplify.

## Troubleshooting

### "Google Client ID is not configured" error
- **Check environment variables**: Ensure `VITE_GOOGLE_CLIENT_ID` is set in your `.env` file
- **Restart dev server**: Environment variables are loaded at startup

### Google sign-in popup doesn't appear
- **Check browser console**: Look for JavaScript errors
- **Check Google Client ID**: Verify it's correct in Google Cloud Console
- **Check authorized origins**: Ensure your domain is in Google Cloud Console's authorized JavaScript origins

### "Failed to exchange authorization code" error
- **Check Cognito domain**: Verify `VITE_AWS_COGNITO_DOMAIN` is correct
- **Check callback URLs**: Ensure your app URL is in Cognito's allowed callback URLs
- **Check network tab**: Look for the token exchange request and its response

### Redirect loop or stuck on redirect
- **Check Cognito configuration**: Ensure Google is enabled as an identity provider
- **Check callback URLs**: Must match exactly in Cognito settings
- **Clear browser cache and cookies**: Sometimes helps with redirect issues

### User not created in database
- **Check backend logs**: The backend should create a user when a Google user signs in for the first time
- **Verify token**: Ensure the Cognito token contains the expected user information

## Important Notes

1. **No Hosted UI Required**: This implementation doesn't use Cognito's Hosted UI, giving you full control over the UI

2. **Google Identity Services**: Uses Google's modern Identity Services SDK (gsi), not the deprecated gapi

3. **Security**:
   - Never commit `.env` files to version control
   - Use different Google OAuth clients for development and production
   - Rotate Client Secrets periodically
   - Monitor OAuth usage in both Cognito and Google Cloud Console

4. **User Creation**:
   - When a user signs in with Google for the first time, Cognito automatically creates a user
   - The backend should handle creating a corresponding user record in your database
   - Check your backend logs if users aren't being created properly

5. **Email Verification**:
   - Google-authenticated users are automatically verified (Google handles email verification)
   - No email confirmation code is needed for Google sign-ins

## Summary Checklist

- [ ] Created Google OAuth credentials in Google Cloud Console
- [ ] Added Google as identity provider in Cognito User Pool
- [ ] Configured App Client to enable Google in OAuth settings
- [ ] Set callback URLs in App Client settings
- [ ] Added `VITE_GOOGLE_CLIENT_ID` to `.env` file
- [ ] Added `VITE_AWS_COGNITO_DOMAIN` to `.env` file
- [ ] Tested Google sign-in flow
- [ ] Verified user creation in database after Google sign-in

## Need Help?

- **Google Identity Services Documentation**: https://developers.google.com/identity/gsi/web
- **AWS Cognito Documentation**: https://docs.aws.amazon.com/cognito/
- **Amplify Auth Documentation**: https://docs.amplify.aws/react/build-a-backend/auth/
