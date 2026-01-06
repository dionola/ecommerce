# Authentication Architecture

This document describes the authentication architecture for the e-commerce application.

## Overview

The application uses AWS Cognito for authentication with a clean separation between frontend and backend:

- **Frontend**: Uses AWS Amplify SDK to handle user authentication (sign up, sign in, token management)
- **Backend**: Verifies JWT tokens from Cognito and checks user roles from Cognito User Groups

## Architecture Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌──────────┐
│  User   │────────▶│ Frontend │────────▶│ Amplify │────────▶│ Cognito  │
└─────────┘         └──────────┘         └─────────┘         └──────────┘
                            │
                            │ JWT Token
                            ▼
                    ┌──────────┐         ┌──────────┐
                    │ Backend  │────────▶│ Database │
                    └──────────┘         └──────────┘
```

## Frontend Authentication

### Components

1. **Amplify Configuration** (`client/src/config/amplify.ts`)
   - Configures AWS Amplify with Cognito settings
   - Validates environment variables
   - Single source of truth for Cognito config

2. **Auth Service** (`client/src/services/auth.ts`)
   - Wraps Amplify auth functions
   - Provides clean, type-safe API
   - Handles token retrieval and user info extraction

3. **Auth Context** (`client/src/contexts/AuthContext.tsx`)
   - React context for authentication state
   - Manages user session and token
   - Provides auth methods to components

### Authentication Flow

1. **Sign Up**:
   - User enters email, password, and optional name
   - Frontend calls `signUp()` from auth service
   - Cognito creates user and sends verification code
   - User enters verification code
   - Frontend calls `confirmSignUp()`
   - User account is confirmed

2. **Sign In**:
   - User enters email and password
   - Frontend calls `signIn()` from auth service
   - Cognito authenticates and returns JWT tokens
   - Amplify stores tokens securely
   - Auth context updates with user info

3. **Token Management**:
   - Amplify automatically handles token refresh
   - Tokens are stored securely by Amplify
   - Frontend retrieves tokens via `getAuthToken()`

## Backend Authentication

### Components

1. **Cognito Configuration** (`server/config/cognito.ts`)
   - Sets up JWT verifier
   - Configures Cognito client for admin operations
   - Validates environment variables

2. **Authentication Middleware** (`server/middleware/auth.ts`)
   - Verifies JWT tokens from Authorization header
   - Extracts user information (sub, email, groups)
   - Attaches user info to request object

3. **Authorization Middleware** (`server/middleware/authorize.ts`)
   - Checks user roles from JWT token
   - Validates access to protected endpoints
   - Supports multiple roles (admin, superadmin)

4. **User Service** (`server/services/users/userService.ts`)
   - Manages user records in database
   - Links Cognito users to database users
   - Handles user creation and lookup

### Authentication Flow

1. **Request with Token**:
   - Frontend sends request with `Authorization: Bearer <token>` header
   - Backend extracts token from header

2. **Token Verification**:
   - Backend verifies token signature using Cognito public keys
   - Validates token expiration and audience
   - Extracts user information from token payload

3. **User Lookup**:
   - Backend uses `cognito_sub` from token to find user in database
   - Creates user record if doesn't exist (first-time login)
   - Attaches user ID to request

4. **Authorization Check**:
   - Backend checks `cognito:groups` claim from token
   - Validates user has required role for endpoint
   - Returns 403 if insufficient permissions

## JWT Token Structure

Cognito ID tokens contain the following claims:

```json
{
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "cognito:groups": ["admin", "superadmin"],
  "iat": 1234567890,
  "exp": 1234571490,
  "aud": "client-id",
  "iss": "https://cognito-idp.region.amazonaws.com/user-pool-id"
}
```

### Key Claims

- `sub`: Unique user identifier (Cognito sub)
- `email`: User's email address
- `cognito:groups`: Array of user groups (roles)
- `exp`: Token expiration timestamp
- `aud`: Client ID (audience)
- `iss`: Token issuer (Cognito User Pool)

## Role-Based Access Control

### Roles

1. **user** (default)
   - All authenticated users
   - Access to basic endpoints (cart, orders, wishlist)

2. **admin**
   - Administrator users
   - Access to admin endpoints
   - Can manage products, orders, etc.

3. **superadmin**
   - Super administrator users
   - Full system access
   - Can manage users, system settings, etc.

### Implementation

Roles are stored in Cognito User Groups and included in JWT tokens. The backend checks roles from the `cognito:groups` claim:

```typescript
// Example: Protect admin endpoint
router.get('/admin/products', authenticate, authorize('admin'), getProducts);
```

## Database Integration

### User Table

The `users` table links Cognito users to application data:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  cognito_sub UUID UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Creation

When a user first authenticates:
1. Backend receives JWT token with `cognito_sub`
2. Backend checks if user exists in database
3. If not, creates user record with `cognito_sub` and email
4. User is now linked to application data (cart, orders, etc.)

## Security Considerations

1. **Token Security**:
   - Tokens are verified using Cognito public keys
   - Tokens expire automatically (handled by Cognito)
   - Tokens are never stored in localStorage manually (Amplify handles this)

2. **Password Security**:
   - Passwords are never sent to backend
   - Cognito handles password hashing and validation
   - Password policies enforced by Cognito

3. **Role Security**:
   - Roles are stored in Cognito, not database
   - Roles are verified from JWT token (can't be spoofed)
   - Backend always verifies token signature

4. **HTTPS**:
   - Required in production
   - Prevents token interception
   - Ensures secure communication

## Error Handling

### Frontend Errors

- Authentication errors are caught and displayed to user
- Token refresh failures trigger re-authentication
- Network errors are handled gracefully

### Backend Errors

- Invalid tokens return 401 Unauthorized
- Missing tokens return 401 Unauthorized
- Insufficient permissions return 403 Forbidden
- All errors are logged for debugging

## Testing

### Frontend Testing

- Test sign up flow
- Test sign in flow
- Test token refresh
- Test error handling

### Backend Testing

- Test token verification
- Test role authorization
- Test user creation
- Test error responses

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token rotation
2. **MFA**: Add multi-factor authentication support
3. **Social Login**: Add OAuth providers (Google, Facebook)
4. **Session Management**: Add session timeout and management
5. **Audit Logging**: Log all authentication events

