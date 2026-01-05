import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { signUp, signIn, confirmSignUp, signOut, getCurrentSession, resendConfirmationCode } from '../services/cognitoAuth';
import type { AuthResult } from '../services/cognitoAuth';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: { email: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getCurrentSession();
        if (session) {
          setToken(session.idToken);
          // Extract email from token (basic parsing)
          try {
            const payload = JSON.parse(atob(session.idToken.split('.')[1]));
            setUser({ email: payload.email || payload['cognito:username'] });
          } catch {
            // If we can't parse, that's okay
          }
        }
      } catch {
        // No valid session
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn({ email, password });
    setToken(result.idToken);
    setUser({ email });
    // Store tokens in localStorage for persistence
    localStorage.setItem('authToken', result.idToken);
    if (result.refreshToken) {
      localStorage.setItem('refreshToken', result.refreshToken);
    }
  };

  const handleSignUp = async (email: string, password: string, name?: string) => {
    await signUp({ email, password, name });
  };

  const handleConfirmSignUp = async (email: string, code: string) => {
    await confirmSignUp(email, code);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Ignore errors - we'll clear local state anyway
    } finally {
      // Even if signOut fails, clear local state
      setToken(null);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const handleResendConfirmationCode = async (email: string) => {
    await resendConfirmationCode(email);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        loading,
        user,
        signIn: handleSignIn,
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
