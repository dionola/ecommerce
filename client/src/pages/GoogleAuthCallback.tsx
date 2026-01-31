import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Google OAuth callback page
 * 
 * This page handles the redirect from Google OAuth and extracts the ID token.
 * It then posts a message back to the parent window (the tab that opened it).
 */
export default function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Google OAuth returns the ID token in the URL hash for response_type=id_token
    const hash = window.location.hash.substring(1); // Remove the #
    const params = new URLSearchParams(hash);
    
    // Extract the ID token
    const idToken = params.get('id_token');
    const error = params.get('error');

    if (error) {
      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_ERROR',
            error: error === 'access_denied' ? 'Google sign-in was cancelled' : error,
          },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    if (idToken) {
      // Send success message with token to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_SUCCESS',
            token: idToken,
          },
          window.location.origin
        );
      }
      window.close();
    } else {
      // No token found
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_ERROR',
            error: 'No token received from Google',
          },
          window.location.origin
        );
      }
      window.close();
    }
  }, [searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <p>Completing sign-in...</p>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          This window will close automatically.
        </p>
      </div>
    </div>
  );
}

