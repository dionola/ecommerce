# Complete Authentication Setup Guide

This guide will help you set up AWS Cognito authentication for both the frontend and backend of your e-commerce application.

## Prerequisites

- AWS Account with access to Cognito
- Node.js and pnpm installed
- Basic understanding of AWS Cognito

## Step 1: Create AWS Cognito User Pool

1. **Go to AWS Console** → **Cognito** → **User Pools**
2. Click **"Create user pool"**
3. **Configure sign-in experience**:
   - Choose "Email" as the sign-in option
   - Click "Next"
4. **Configure security requirements**:
   - Set password policy (minimum 8 characters, uppercase, lowercase, number, special character)
   - Choose MFA if desired (optional for development)
   - Click "Next"
5. **Configure sign-up experience**:
   - Enable self-registration
   - Choose "Send email with Cognito" for verification
   - Click "Next"
6. **Configure message delivery**:
   - Choose "Send email with Cognito" (or configure SES if you have it)
   - Click "Next"
7. **Integrate your app**:
   - Enter a User Pool name (e.g., `ecommerce-user-pool`)
   - Click "Next"
8. **Review and create**:
   - Review settings
   - Click "Create user pool"

## Step 2: Create App Client

1. In your User Pool, go to **App integration** tab
2. Scroll to **App clients** section
3. Click **"Create app client"**
4. **Configure app client**:
   - App client name: `ecommerce-client`
   - **IMPORTANT**: Uncheck "Generate client secret" (we're using public client)
   - Click "Next"
5. **Configure app client authentication**:
   - Authentication flows: Enable **"ALLOW_USER_PASSWORD_AUTH"**
   - OAuth 2.0 grant types: Enable "Authorization code grant" and "Implicit grant" (optional)
   - OAuth 2.0 scopes: Select `email`, `openid`, `profile`
   - Click "Next"
6. **Review and create**:
   - Click "Create app client"

## Step 3: Configure User Pool Attributes

1. Go to **Sign-up experience** tab
2. Under **Required attributes**, ensure:
   - ✅ Email
   - ✅ Name (optional, but recommended)
3. Under **User pool properties**, note:
   - **User Pool ID** (format: `us-east-1_XXXXXXXXX`)
   - **Region** (e.g., `us-east-1`)

## Step 4: Set Up User Groups (Optional but Recommended)

For role-based access control (admin, superadmin):

1. Go to **User groups** tab
2. Click **"Create group"**
3. Create groups:
   - **Group name**: `admin`
   - **Description**: "Administrator users"
   - Click "Create group"
4. Repeat for `superadmin` group if needed

## Step 5: Configure Frontend Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_AWS_COGNITO_CLIENT_ID=your-client-id-here
VITE_AWS_REGION=us-east-1
```

**To get these values:**
- **User Pool ID**: User Pool → General settings → User pool ID
- **Client ID**: App integration → App clients → Client ID
- **Region**: Your AWS region (e.g., `us-east-1`)

## Step 6: Configure Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# AWS Cognito Configuration
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=your-client-id-here
AWS_COGNITO_CLIENT_SECRET=  # Leave empty if using public client
AWS_REGION=us-east-1

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Important Notes:**
- The `AWS_COGNITO_USER_POOL_ID` and `AWS_COGNITO_CLIENT_ID` should match your frontend values
- If you created a public client (no secret), leave `AWS_COGNITO_CLIENT_SECRET` empty
- The backend uses these to verify JWT tokens from the frontend

## Step 7: Configure App Client Callback URLs (For OAuth)

If you're using OAuth flows:

1. Go to **App integration** → **App clients**
2. Click on your app client
3. Under **Hosted UI settings**:
   - **Allowed callback URLs**: Add your frontend URL
     - Development: `http://localhost:5173`
     - Production: `https://yourdomain.com`
   - **Allowed sign-out URLs**: Add the same URLs
4. Click **Save changes**

## Step 8: Test Authentication

### Frontend Testing

1. Start the frontend:
   ```bash
   cd client
   pnpm install
   pnpm dev
   ```

2. Navigate to your app (e.g., `http://localhost:5173`)
3. Try signing up with a new account
4. Check your email for the verification code
5. Confirm the account and sign in

### Backend Testing

1. Start the backend:
   ```bash
   cd server
   pnpm install
   pnpm dev
   ```

2. The backend will automatically verify JWT tokens from authenticated requests
3. Test protected endpoints with the token from your frontend

## Step 9: Create Test Users (Optional)

You can create test users directly in Cognito:

1. Go to **Users** tab in your User Pool
2. Click **"Create user"**
3. Enter email and temporary password
4. Uncheck "Send an email invitation" if you want to set password manually
5. Click "Create user"

**To assign users to groups:**
1. Click on the user
2. Go to **Groups** tab
3. Click **"Add user to group"**
4. Select the group (e.g., `admin`)

## Troubleshooting

### Frontend Issues

**Problem**: "VITE_AWS_COGNITO_USER_POOL_ID is not set"
- **Solution**: Make sure your `.env` file is in the `client` directory and has the correct variable names (must start with `VITE_`)

**Problem**: Authentication fails
- **Solution**: 
  - Verify your User Pool ID and Client ID are correct
  - Check that `ALLOW_USER_PASSWORD_AUTH` is enabled in your app client
  - Ensure your region matches

### Backend Issues

**Problem**: "AWS_COGNITO_USER_POOL_ID environment variable is required"
- **Solution**: Make sure your `.env` file is in the `server` directory and contains all required variables

**Problem**: JWT verification fails
- **Solution**:
  - Verify the User Pool ID and Client ID match between frontend and backend
  - Check that the token is being sent correctly in the Authorization header: `Bearer <token>`
  - Ensure your AWS credentials are configured (if using AWS SDK)

**Problem**: 403 Forbidden when accessing admin routes
- **Solution**: 
  - Make sure the user is assigned to the correct Cognito group (`admin` or `superadmin`)
  - Verify the JWT token includes the `cognito:groups` claim

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use different User Pools** for development and production
3. **Enable MFA** in production
4. **Use HTTPS** in production
5. **Rotate secrets** regularly
6. **Monitor Cognito logs** in CloudWatch

## Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Auth Documentation](https://docs.amplify.aws/react/build-a-backend/auth/)
- [JWT Verification Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

## Quick Reference

### Required Environment Variables

**Frontend (`client/.env`):**
```env
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_AWS_COGNITO_CLIENT_ID=your-client-id
VITE_AWS_REGION=us-east-1
```

**Backend (`server/.env`):**
```env
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=your-client-id
AWS_REGION=us-east-1
```

### Cognito App Client Settings

- ✅ Enable `ALLOW_USER_PASSWORD_AUTH`
- ✅ OAuth scopes: `email`, `openid`, `profile`
- ✅ Public client (no client secret)

### User Groups

- `admin` - Administrator access
- `superadmin` - Super administrator access

