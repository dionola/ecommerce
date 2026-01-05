import { Amplify } from 'aws-amplify';

// Cognito configuration
const cognitoConfig = {
  userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID || '',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
};

if (!cognitoConfig.userPoolId) {
  console.warn('VITE_AWS_COGNITO_USER_POOL_ID is not set');
}

if (!cognitoConfig.clientId) {
  console.warn('VITE_AWS_COGNITO_CLIENT_ID is not set');
}

// Configure Amplify
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

