import { Request, Response } from "express";
import {
  InitiateAuthCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoConfig, cognitoClient } from "../config/cognito.js";
import { logger } from "../utils/logger.js";
import crypto from "crypto";

/**
 * Generate secret hash for Cognito authentication
 * Only needed if using a client with secret
 */
function generateSecretHash(username: string): string {
  if (!cognitoConfig.clientSecret) {
    return "";
  }

  return crypto
    .createHmac("SHA256", cognitoConfig.clientSecret)
    .update(username + cognitoConfig.clientId)
    .digest("base64");
}

/**
 * Get a test token for Swagger UI testing (development only)
 * 
 * This endpoint allows you to get a JWT token for testing API endpoints in Swagger UI.
 * It authenticates with Cognito using username/password and returns the ID token.
 * 
 * Use a valid development user from the connected Cognito user pool.
 */
async function getTestToken(req: Request, res: Response): Promise<void> {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({
      message: "Not found",
    });
    return;
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
        example: {
          email: "dev-admin@example.com",
          password: "YourDevPassword123!",
        },
      });
      return;
    }

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

    if (!response.AuthenticationResult?.IdToken) {
      res.status(401).json({
        message: "Authentication failed - Invalid email or password",
      });
      return;
    }

    const token = response.AuthenticationResult.IdToken;
    const expiresIn = response.AuthenticationResult.ExpiresIn || 3600;

    // Extract user info from token for display
    let userInfo = {};
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      userInfo = {
        email: payload.email,
        groups: payload["cognito:groups"] || [],
      };
    } catch {
      // Ignore parsing errors
    }

    res.json({
      token,
      expiresIn,
      user: userInfo,
      instructions: {
        step1: "Copy the 'token' value above",
        step2: "Click the 'Authorize' button at the top of the Swagger UI",
        step3: "Paste the token into the 'Value' field",
        step4: "Click 'Authorize' then 'Close'",
        step5: "Now you can test authenticated endpoints!",
      },
    });
  } catch (error: any) {
    logger.error("Test token generation error:", error);

    if (error.name === "NotAuthorizedException") {
      res.status(401).json({
        message: "Invalid email or password",
        hint: "Use a valid development user from your Cognito user pool",
      });
      return;
    }

    if (error.name === "UserNotConfirmedException") {
      res.status(400).json({
        message: "User email not confirmed",
        hint: "Make sure the user has confirmed their email in Cognito",
      });
      return;
    }

    res.status(500).json({
      message: "Failed to generate test token",
      error: error.message || "Unknown error",
    });
  }
}

export default {
  getTestToken,
};
