/**
 * Helper script to get a Cognito JWT token for testing
 * Usage: tsx scripts/get-token.ts <email> <password>
 * 
 * This will authenticate with Cognito and print the ID token
 * which you can use in Swagger UI
 */

import "dotenv/config";
import {
  InitiateAuthCommand,
  AuthenticationResultType,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { cognitoClient, cognitoConfig } from "../config/cognito";

function generateSecretHash(username: string): string {
  if (!cognitoConfig.clientSecret) {
    throw new Error("Client secret is required but not configured");
  }
  
  return createHmac("SHA256", cognitoConfig.clientSecret)
    .update(username + cognitoConfig.clientId)
    .digest("base64");
}

async function getToken(email: string, password: string): Promise<void> {
  try {
    // Build auth parameters
    const authParameters: Record<string, string> = {
      USERNAME: email,
      PASSWORD: password,
    };

    // Add SECRET_HASH if client secret is configured
    if (cognitoConfig.clientSecret) {
      authParameters.SECRET_HASH = generateSecretHash(email);
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: cognitoConfig.clientId,
      AuthParameters: authParameters,
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult?.IdToken) {
      console.log("\n✅ Authentication successful!\n");
      console.log("ID Token (use this in Swagger UI):");
      console.log("─".repeat(80));
      console.log(response.AuthenticationResult.IdToken);
      console.log("─".repeat(80));
      console.log("\n📋 Copy the token above and paste it into Swagger UI's Authorize dialog");
      console.log("   (without the 'Bearer ' prefix)\n");
    } else {
      console.error("❌ No token received. Response:", response);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Authentication failed:", error.message);
    if (error.name === "NotAuthorizedException") {
      console.error("   Check your email and password");
    } else if (error.name === "UserNotConfirmedException") {
      console.error("   User email is not confirmed");
    }
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: tsx scripts/get-token.ts <email> <password>");
  console.error("\nExample:");
  console.error("  tsx scripts/get-token.ts admin@example.com TestAdmin123!");
  process.exit(1);
}

getToken(email, password);

