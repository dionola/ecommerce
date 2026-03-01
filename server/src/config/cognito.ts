import "dotenv/config";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

/**
 * Validates that all required Cognito environment variables are set
 */
function validateCognitoConfig(): void {
  const requiredVars = {
    AWS_COGNITO_USER_POOL_ID: process.env.AWS_COGNITO_USER_POOL_ID,
    AWS_COGNITO_CLIENT_ID: process.env.AWS_COGNITO_CLIENT_ID,
    AWS_REGION: process.env.AWS_REGION,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Cognito environment variables: ${missingVars.join(", ")}`
    );
  }
}

// Validate configuration on import
validateCognitoConfig();

/**
 * Cognito JWT Verifier
 * Verifies ID tokens from Cognito using the User Pool's public keys
 */
export const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.AWS_COGNITO_CLIENT_ID!,
});

/**
 * Cognito configuration object
 * Contains all Cognito-related configuration values
 */
export const cognitoConfig = {
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
  clientId: process.env.AWS_COGNITO_CLIENT_ID!,
  clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET || undefined,
  region: process.env.AWS_REGION!,
} as const;

/**
 * Cognito Identity Provider Client
 * Used for admin operations like creating users, managing groups, etc.
 * Only needed for server-side user management operations
 */
export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});
