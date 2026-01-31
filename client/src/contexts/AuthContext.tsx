import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  confirmSignUp as authConfirmSignUp,
  resendConfirmationCode as authResendConfirmationCode,
  getAuthToken,
  getUserInfo,
} from '../services/auth';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: { email: string; groups?: string[] } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; groups?: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Refresh authentication state from Amplify session
   */
  const refreshAuthState = async (): Promise<void> => {
    try {
      const currentToken = await getAuthToken();
      const userInfo = await getUserInfo();

      if (currentToken && userInfo) {
        setToken(currentToken);
        setUser(userInfo);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      // Log error for debugging (only in development)
      if (import.meta.env.DEV) {
        console.error('Failed to refresh auth state:', error);
      }
      setToken(null);
      setUser(null);
    }
  };

  // Check for existing session on mount and set up listener
  useEffect(() => {
    const checkSession = async () => {
      await refreshAuthState();
      setLoading(false);
    };

    checkSession();

    // Set up interval to periodically check auth state (in case of token refresh)
    const interval = setInterval(() => {
      refreshAuthState().catch(() => {
        // Silently handle errors - user might have signed out
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Sign in handler
   */
  const handleSignIn = async (email: string, password: string): Promise<void> => {
    await authSignIn({ email, password });
    // Small delay to ensure Amplify has stored the session
    await new Promise(resolve => setTimeout(resolve, 100));
    // Refresh auth state after successful sign in
    await refreshAuthState();
  };

  /**
   * Google sign in handler
   * Opens Google OAuth in a new tab and waits for callback
   */
  const handleSignInWithGoogle = async (): Promise<void> => {
    try {
      await authSignInWithGoogle();
      // Small delay to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 100));
      // Refresh auth state after successful sign in
      await refreshAuthState();
    } catch (error) {
      // Error is already handled in the auth service
      throw error;
    }
  };

  /**
   * Sign up handler
   */
  const handleSignUp = async (email: string, password: string, name?: string): Promise<void> => {
    await authSignUp({ email, password, name });
    // Don't refresh auth state here - user needs to confirm email first
  };

  /**
   * Confirm sign up handler
   */
  const handleConfirmSignUp = async (email: string, code: string): Promise<void> => {
    await authConfirmSignUp(email, code);
    // After confirmation, user can sign in
  };

  /**
   * Sign out handler
   */
  const handleSignOut = async (): Promise<void> => {
    try {
      await authSignOut();
    } catch (error) {
      // Log error but continue with clearing state
      if (import.meta.env.DEV) {
        console.error('Sign out error:', error);
      }
    } finally {
      // Always clear local state, even if sign out fails
      setToken(null);
      setUser(null);
    }
  };

  /**
   * Resend confirmation code handler
   */
  const handleResendConfirmationCode = async (email: string): Promise<void> => {
    await authResendConfirmationCode(email);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        loading,
        user,
        signIn: handleSignIn,
        signInWithGoogle: handleSignInWithGoogle,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        signOut: handleSignOut,
        resendConfirmationCode: handleResendConfirmationCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
