import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

/**
 * Parameters for user sign up
 */
export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
}

/**
 * Parameters for user sign in
 */
export interface SignInParams {
  email: string;
  password: string;
}

/**
 * Result of sign up operation
 */
export interface SignUpResult {
  userId: string;
  nextStep: {
    signUpStep: string;
  };
}

/**
 * Current user information
 */
export interface CurrentUser {
  userId: string;
  username: string;
}

/**
 * Sign up a new user
 * 
 * @param params - Sign up parameters (email, password, optional name)
 * @returns Sign up result with userId and next step
 * @throws Error if sign up fails
 */
export async function signUp(params: SignUpParams): Promise<SignUpResult> {
  try {
    const result = await amplifySignUp({
      username: params.email,
      password: params.password,
      options: {
        userAttributes: {
          email: params.email,
          ...(params.name && { name: params.name }),
        },
        autoSignIn: false,
      },
    });

    return {
      userId: result.userId ?? params.email,
      nextStep: {
        signUpStep: (result.nextStep as any)?.signUpStep || 'CONFIRM_SIGN_UP',
      },
    };
  } catch (error: any) {
    throw new Error(error.message || 'Sign up failed');
  }
}

/**
 * Confirm sign up with verification code
 * 
 * @param email - User's email address
 * @param code - Verification code from email
 * @throws Error if confirmation fails
 */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  try {
    await amplifyConfirmSignUp({
      username: email,
      confirmationCode: code,
    });
  } catch (error: any) {
    throw new Error(error.message || 'Email confirmation failed');
  }
}

/**
 * Resend confirmation code
 * 
 * @param email - User's email address
 * @throws Error if resend fails
 */
export async function resendConfirmationCode(email: string): Promise<void> {
  try {
    await amplifyResendSignUpCode({
      username: email,
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to resend confirmation code');
  }
}

/**
 * Sign in an existing user
 * 
 * @param params - Sign in parameters (email, password)
 * @throws Error if sign in fails
 */
export async function signIn(params: SignInParams): Promise<void> {
  try {
    const result = await amplifySignIn({
      username: params.email,
      password: params.password,
    });

    if (!result.isSignedIn) {
      throw new Error('Sign in failed');
    }
  } catch (error: any) {
    // Provide more user-friendly error messages
    if (error.name === 'NotAuthorizedException') {
      throw new Error('Incorrect email or password');
    } else if (error.name === 'UserNotConfirmedException') {
      throw new Error('Please confirm your email address. Check your inbox for a verification code.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Sign in failed');
    }
  }
}

/**
 * Sign out the current user
 * 
 * @throws Error if sign out fails
 */
export async function signOut(): Promise<void> {
  try {
    // Clear Google token if present
    sessionStorage.removeItem('google_id_token');

    // Sign out from Amplify (Cognito)
    await amplifySignOut();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
    throw new Error(errorMessage);
  }
}

/**
 * Get the current authenticated user
 * 
 * @returns Current user information or null if not authenticated
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const user = await amplifyGetCurrentUser();
    return {
      userId: user.userId,
      username: user.username,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current JWT ID token
 * 
 * Amplify automatically handles token refresh, so this will always
 * return a valid token if the user is authenticated.
 * 
 * @returns JWT ID token or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Check for Google token first (stored in sessionStorage)
    const googleToken = sessionStorage.getItem('google_id_token');
    if (googleToken) {
      return googleToken;
    }

    // Otherwise, try to get Cognito token from Amplify
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
}

/**
 * Get user information from the JWT token
 * 
 * @returns User information (email, groups) or null if not authenticated
 */
export async function getUserInfo(): Promise<{ email: string; groups?: string[] } | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return null;
    }

    // Decode JWT token (base64 decode the payload with UTF-8 support)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // Check if it's a Google token or Cognito token
    if (payload.iss && payload.iss.includes('google')) {
      // Google token
      return {
        email: payload.email || '',
        groups: undefined, // Google users don't have Cognito groups
      };
    } else {
      // Cognito token
      return {
        email: payload.email || payload['cognito:username'],
        groups: payload['cognito:groups'],
      };
    }
  } catch {
    return null;
  }
}

/**
 * Google Identity Services types
 */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

/**
 * Sign in with Google using OAuth redirect flow (opens in new tab)
 * 
 * All authentication happens on the client side. The server only verifies JWT tokens.
 * This redirects to Google OAuth and handles the callback to get the ID token.
 * @throws Error if sign in fails
 */
export async function signInWithGoogle(): Promise<void> {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
  }

  // Build redirect URI - this page will handle the callback
  const redirectUri = `${window.location.origin}/auth/google/callback`;

  if (import.meta.env.DEV) {
    console.log('Google OAuth redirect URI:', redirectUri);
    console.log('Make sure this EXACT URI is added to Google Cloud Console:');
    console.log('  - Go to: APIs & Services → Credentials → Your OAuth Client');
    console.log('  - Under "Authorized redirect URIs", add:', redirectUri);
  }

  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', googleClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'id_token');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('nonce', Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

  // Open in new tab
  const authWindow = window.open(
    authUrl.toString(),
    'google-auth',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  if (!authWindow) {
    throw new Error('Failed to open Google sign-in window. Please allow popups for this site.');
  }

  // Wait for the callback to complete
  // The callback page will post a message back to this window
  return new Promise<void>((resolve, reject) => {
    const messageListener = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const token = event.data.token;
        if (token) {
          // Store Google token in sessionStorage
          sessionStorage.setItem('google_id_token', token);
          window.removeEventListener('message', messageListener);
          authWindow.close();
          resolve();
        } else {
          window.removeEventListener('message', messageListener);
          authWindow.close();
          reject(new Error('No token received from Google'));
        }
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', messageListener);
        authWindow.close();
        reject(new Error(event.data.error || 'Google sign-in failed'));
      }
    };

    window.addEventListener('message', messageListener);

    // Handle window closed manually
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        reject(new Error('Google sign-in was cancelled'));
      }
    }, 1000);
  });
}
