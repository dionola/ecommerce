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
      userId: result.userId,
      nextStep: {
        signUpStep: result.nextStep.signUpStep || 'CONFIRM_SIGN_UP',
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
    await amplifySignOut();
  } catch (error: any) {
    throw new Error(error.message || 'Sign out failed');
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

    // Decode JWT token (base64 decode the payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return {
      email: payload.email || payload['cognito:username'],
      groups: payload['cognito:groups'],
    };
  } catch {
    return null;
  }
}

