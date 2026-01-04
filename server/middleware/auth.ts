import { Request, Response, NextFunction } from "express";
import { cognitoVerifier } from "../config/cognito";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    "cognito:groups"?: string[];
    [key: string]: any;
  };
}

/**
 * Middleware to authenticate requests using AWS Cognito JWT tokens
 * Extracts and verifies the Authorization Bearer token
 * Requires authentication - returns 401 if token is missing or invalid
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Unauthorized - Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const payload = await cognitoVerifier.verify(token);
      
      // Attach user information to request
      req.user = {
        ...payload,
        sub: payload.sub as string,
        email: payload.email as string,
        "cognito:groups": payload["cognito:groups"] as string[] | undefined,
      };

      next();
    } catch (error) {
      logger.warn("JWT verification failed:", error);
      res.status(401).json({
        message: "Unauthorized - Invalid or expired token",
      });
      return;
    }
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(500).json({
      message: "Internal server error during authentication",
    });
    return;
  }
}

/**
 * Optional authentication middleware that allows guest access
 * If a valid token is provided, user info is attached to the request
 * If no token or invalid token, request continues without user info (guest access)
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    // No auth header - allow as guest
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const payload = await cognitoVerifier.verify(token);
      
      // Attach user information to request if token is valid
      req.user = {
        ...payload,
        sub: payload.sub as string,
        email: payload.email as string,
        "cognito:groups": payload["cognito:groups"] as string[] | undefined,
      };

      next();
    } catch (error) {
      // Invalid token - log warning but allow as guest
      logger.warn("JWT verification failed for optional auth, allowing guest access:", error);
      next();
      return;
    }
  } catch (error) {
    // Server error - log but still allow guest access
    logger.error("Optional authentication error, allowing guest access:", error);
    next();
    return;
  }
}

