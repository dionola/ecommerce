# AWS Cognito Setup

This application uses AWS Cognito for authentication directly from the frontend.

## Environment Variables

Create a `.env` file in the `client` directory with the following variables:

```env
VITE_AWS_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_AWS_COGNITO_CLIENT_ID=your-client-id
VITE_AWS_REGION=us-east-1
```

## Getting Your Cognito Configuration

1. Go to AWS Console → Cognito → User Pools
2. Select your User Pool
3. Copy the **User Pool ID** (format: `us-east-1_XXXXXXXXX`)
4. Go to **App integration** → **App clients**
5. Copy the **Client ID**
6. Note your **AWS Region**

## App Client Settings

Make sure your Cognito App Client has the following settings:

- **Allowed OAuth flows**: Enable "ALLOW_USER_PASSWORD_AUTH" if you want username/password authentication
- **Allowed OAuth scopes**: email, openid, profile
- **Callback URLs**: Add your frontend URL (e.g., `http://localhost:5173`)
- **Sign out URLs**: Add your frontend URL

## Authentication Flow

1. **Sign Up**: Users can create accounts with email and password
2. **Email Confirmation**: Users receive a confirmation code via email
3. **Sign In**: After confirmation, users can sign in with email and password
4. **Token Management**: Tokens are stored in localStorage and automatically refreshed

## Password Requirements

Make sure your Cognito User Pool password policy matches these requirements (or update the frontend validation):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

You can adjust these in your Cognito User Pool settings.

