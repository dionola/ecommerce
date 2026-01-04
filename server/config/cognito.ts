import "dotenv/config";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

if (!process.env.AWS_COGNITO_USER_POOL_ID) {
  throw new Error("AWS_COGNITO_USER_POOL_ID environment variable is required");
}

if (!process.env.AWS_COGNITO_CLIENT_ID) {
  throw new Error("AWS_COGNITO_CLIENT_ID environment variable is required");
}

if (!process.env.AWS_REGION) {
  throw new Error("AWS_REGION environment variable is required");
}

export const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  tokenUse: "id",
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
});

export const cognitoConfig = {
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
  region: process.env.AWS_REGION
};

// Cognito Identity Provider Client for user management operations
export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

