import { Request, Response } from "express";
import {
  InitiateAuthCommand,
  AuthenticationResultType,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { cognitoClient, cognitoConfig } from "../config/cognito";
import { logger } from "../utils/logger";

// Seeded users from the seed script
const SEEDED_USERS = {
  user: {
    email: "user@example.com",
    password: "TestUser123!",
  },
  admin: {
    email: "admin@example.com",
    password: "TestAdmin123!",
  },
  superadmin: {
    email: "superadmin@example.com",
    password: "TestSuperAdmin123!",
  },
} as const;

type UserType = keyof typeof SEEDED_USERS;

/**
 * Generate SECRET_HASH for Cognito authentication
 * Required when the Cognito app client has a client secret
 */
function generateSecretHash(username: string): string {
  if (!cognitoConfig.clientSecret) {
    throw new Error("Client secret is required but not configured");
  }
  
  return createHmac("SHA256", cognitoConfig.clientSecret)
    .update(username + cognitoConfig.clientId)
    .digest("base64");
}

/**
 * Get a token for a seeded user (development only)
 */
async function getDevToken(req: Request, res: Response): Promise<void> {
  try {
    const userType = req.params.userType as UserType;

    if (!userType || !SEEDED_USERS[userType]) {
      res.status(400).json({
        message: "Invalid user type",
        availableTypes: Object.keys(SEEDED_USERS),
      });
      return;
    }

    const user = SEEDED_USERS[userType];

    try {
      // Build auth parameters
      const authParameters: Record<string, string> = {
        USERNAME: user.email,
        PASSWORD: user.password,
      };

      // Add SECRET_HASH if client secret is configured
      if (cognitoConfig.clientSecret) {
        authParameters.SECRET_HASH = generateSecretHash(user.email);
      }

      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: cognitoConfig.clientId,
        AuthParameters: authParameters,
      });

      const response = await cognitoClient.send(command);

      if (!response.AuthenticationResult?.IdToken) {
        res.status(500).json({
          message: "Failed to get token from Cognito",
        });
        return;
      }

      const token = response.AuthenticationResult.IdToken;
      const expiresIn = response.AuthenticationResult.ExpiresIn || 3600;

      res.json({
        token,
        userType,
        email: user.email,
        expiresIn,
        message: `Token generated for ${userType} user. Use this token in the Authorization header as: Bearer ${token.substring(0, 20)}...`,
      });
    } catch (error: any) {
      logger.error("Cognito authentication error:", error);
      
      if (error.name === "NotAuthorizedException") {
        res.status(401).json({
          message: "Authentication failed. User may need to be reset in Cognito.",
          error: error.message,
        });
        return;
      }

      if (error.name === "UserNotConfirmedException") {
        res.status(400).json({
          message: "User email is not confirmed in Cognito",
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        message: "Failed to authenticate with Cognito",
        error: error.message,
      });
    }
  } catch (error: any) {
    logger.error("Dev token generation error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

/**
 * List available seeded users (development only)
 */
async function listDevUsers(req: Request, res: Response): Promise<void> {
  const users = Object.entries(SEEDED_USERS).map(([type, user]) => ({
    type,
    email: user.email,
    role: type === "user" ? "Regular user" : type === "admin" ? "Admin" : "Superadmin",
  }));

  res.json({
    message: "Available seeded users for development",
    users,
    endpoint: "/dev/auth/token/:userType",
    example: "/dev/auth/token/admin",
  });
}

export default {
  getDevToken,
  listDevUsers,
};

