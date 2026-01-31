import { Amplify } from 'aws-amplify';

/**
 * Cognito configuration values from environment variables
 */
const cognitoConfig = {
  userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID || '',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
};

/**
 * Validates that all required Cognito environment variables are set
 */
function validateCognitoConfig(): void {
  const missingVars: string[] = [];

  if (!cognitoConfig.userPoolId) {
    missingVars.push('VITE_AWS_COGNITO_USER_POOL_ID');
  }

  if (!cognitoConfig.clientId) {
    missingVars.push('VITE_AWS_COGNITO_CLIENT_ID');
  }

  if (!import.meta.env.VITE_AWS_REGION) {
    missingVars.push('VITE_AWS_REGION');
  }

  if (missingVars.length > 0) {
    console.error(
      `Missing required Cognito environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file in the client directory.'
    );
  }
}

// Validate configuration
validateCognitoConfig();

/**
 * Configure AWS Amplify with Cognito authentication
 * 
 * This configuration enables:
 * - Email-based authentication
 * - Code-based email verification
 * - Automatic token refresh
 * 
 * Note: Google sign-in is handled directly via Google's JavaScript SDK,
 * not through Cognito's Hosted UI
 */
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.clientId,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
    },
  },
});

export default Amplify;

