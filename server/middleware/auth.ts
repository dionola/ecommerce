import { Request, Response, NextFunction } from "express";
import { cognitoVerifier } from "../config/cognito";
import { logger } from "../utils/logger";
import { OAuth2Client } from "google-auth-library";

const googleAuthClient = new OAuth2Client();
const googleClientId = process.env.GOOGLE_CLIENT_ID;

/**
 * Extended Express Request interface with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    name?: string;
    "cognito:groups"?: string[];
    [key: string]: any;
  };
}

/**
 * Middleware to authenticate requests using AWS Cognito JWT tokens
 * 
 * Extracts the Authorization Bearer token from the request header,
 * verifies it against Cognito's public keys, and attaches user information
 * to the request object.
 * 
 * Returns 401 if:
 * - Authorization header is missing or invalid
 * - Token is invalid or expired
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
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

    // Try to verify as Cognito token first
    let cognitoError: unknown;
    try {
      const payload = await cognitoVerifier.verify(token);
      
      // Extract and attach user information to request
      req.user = {
        sub: payload.sub as string,
        email: payload.email as string,
        "cognito:groups": payload["cognito:groups"] as string[] | undefined,
      };

      next();
      return;
    } catch (error) {
      cognitoError = error;
      // Not a Cognito token, try Google token
      if (googleClientId) {
        try {
          const ticket = await googleAuthClient.verifyIdToken({
            idToken: token,
            audience: googleClientId,
          });
          const googlePayload = ticket.getPayload();

          if (googlePayload && googlePayload.email && googlePayload.sub) {
            // Extract and attach user information from Google token
            req.user = {
              sub: `google_${googlePayload.sub}`,
              email: googlePayload.email,
              name: googlePayload.name || undefined,
              "cognito:groups": undefined, // Google users don't have Cognito groups
            };

            next();
            return;
          }
        } catch (googleError) {
          // Not a Google token either
          logger.warn("JWT verification failed (tried both Cognito and Google):", { cognitoError, googleError });
        }
      }
    }

    // Neither Cognito nor Google token worked
    logger.warn("JWT verification failed - token is neither valid Cognito nor Google token");
    res.status(401).json({
      message: "Unauthorized - Invalid or expired token",
    });
    return;
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
 * 
 * If a valid token is provided, user info is attached to the request.
 * If no token or invalid token, request continues without user info (guest access).
 * 
 * Useful for endpoints that work for both authenticated and unauthenticated users.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
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

    // Try to verify as Cognito token first
    try {
      const payload = await cognitoVerifier.verify(token);
      
      // Attach user information to request if token is valid
      req.user = {
        sub: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string | undefined,
        "cognito:groups": payload["cognito:groups"] as string[] | undefined,
      };

      next();
      return;
    } catch (cognitoError) {
      // Not a Cognito token, try Google token
      if (googleClientId) {
        try {
          const ticket = await googleAuthClient.verifyIdToken({
            idToken: token,
            audience: googleClientId,
          });
          const googlePayload = ticket.getPayload();

          if (googlePayload && googlePayload.email && googlePayload.sub) {
            req.user = {
              sub: `google_${googlePayload.sub}`,
              email: googlePayload.email,
              name: googlePayload.name || undefined,
              "cognito:groups": undefined,
            };

            next();
            return;
          }
        } catch (googleError) {
          // Not a Google token either - allow as guest
          logger.warn("JWT verification failed for optional auth (tried both Cognito and Google), allowing guest access");
        }
      } else {
        // No Google client ID configured - allow as guest
        logger.warn("JWT verification failed for optional auth, allowing guest access:", cognitoError);
      }
    }

    // Invalid token - allow as guest
    next();
    return;
  } catch (error) {
    // Server error - log but still allow guest access
    logger.error("Optional authentication error, allowing guest access:", error);
    next();
    return;
  }
}

