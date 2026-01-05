import { signUp, signIn, signOut, confirmSignUp, resendSignUpCode, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Sign up a new user
 */
export async function signUpUser({ email, password, name }: SignUpParams): Promise<{ userId: string; nextStep: { signUpStep: string } }> {
  const result = await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        ...(name && { name }),
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
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUpUser(email: string, code: string): Promise<void> {
  await confirmSignUp({
    username: email,
    confirmationCode: code,
  });
}

/**
 * Sign in an existing user
 */
export async function signInUser({ email, password }: SignInParams): Promise<AuthResult> {
  const { isSignedIn } = await signIn({
    username: email,
    password,
  });

  if (!isSignedIn) {
    throw new Error('Sign in failed');
  }

  // Get the session to retrieve tokens
  const session = await fetchAuthSession();
  
  if (!session.tokens) {
    throw new Error('Failed to get authentication tokens');
  }

  const idToken = session.tokens.idToken?.toString() || '';
  const accessToken = session.tokens.accessToken?.toString() || '';
  
  // Get expiration from token
  let expiresIn = 3600; // Default 1 hour
  if (session.tokens.idToken) {
    const payload = session.tokens.idToken.payload;
    if (payload.exp && payload.iat) {
      expiresIn = payload.exp - payload.iat;
    }
  }

  return {
    idToken,
    accessToken,
    refreshToken: '', // Amplify handles refresh internally
    expiresIn,
  };
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  await signOut();
}

/**
 * Get the current authenticated user's session
 */
export async function getCurrentSession(): Promise<AuthResult | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const session = await fetchAuthSession();
    
    if (!session.tokens) {
      return null;
    }

    const idToken = session.tokens.idToken?.toString() || '';
    const accessToken = session.tokens.accessToken?.toString() || '';
    
    let expiresIn = 3600;
    if (session.tokens.idToken) {
      const payload = session.tokens.idToken.payload;
      if (payload.exp && payload.iat) {
        expiresIn = payload.exp - payload.iat;
      }
    }

    return {
      idToken,
      accessToken,
      refreshToken: '',
      expiresIn,
    };
  } catch {
    return null;
  }
}

/**
 * Resend confirmation code
 */
async function resendConfirmationCodeUser(email: string): Promise<void> {
  await resendSignUpCode({
    username: email,
  });
}

// Export with the names expected by AuthContext
export { 
  signUpUser as signUp, 
  signInUser as signIn, 
  confirmSignUpUser as confirmSignUp, 
  signOutUser as signOut,
  resendConfirmationCodeUser as resendConfirmationCode
};
