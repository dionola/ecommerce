import { Amplify } from 'aws-amplify';

// Cognito configuration
// These values should match your AWS Cognito User Pool settings
const userPoolId = import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID || '';
const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID || '';
const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

if (!userPoolId) {
  console.warn('VITE_AWS_COGNITO_USER_POOL_ID is not set');
}

if (!clientId) {
  console.warn('VITE_AWS_COGNITO_CLIENT_ID is not set');
}

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId: clientId,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
    },
  },
}, {
  Auth: {
    Cognito: {
      allowGuestAccess: false,
    },
  },
});

export const cognitoConfig = {
  userPoolId,
  clientId,
  region,
};
