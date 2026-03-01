import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { logger } from "../utils/logger";

/**
 * Allowed roles for authorization
 * These correspond to Cognito User Groups
 */
type AllowedRole = "admin" | "superadmin";

/**
 * Middleware factory to authorize requests based on user roles
 * 
 * Checks if the authenticated user has one of the allowed roles from their
 * Cognito User Groups. Roles are extracted from the JWT token's `cognito:groups` claim.
 * 
 * Usage:
 * ```typescript
 * router.get('/admin-only', authenticate, authorize('admin'), handler);
 * router.get('/superadmin-only', authenticate, authorize('superadmin'), handler);
 * router.get('/admin-or-superadmin', authenticate, authorize('admin', 'superadmin'), handler);
 * ```
 * 
 * @param allowedRoles - One or more roles that are allowed to access the endpoint
 * @returns Express middleware function
 */
export function authorize(...allowedRoles: AllowedRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "Unauthorized - User not authenticated",
        });
        return;
      }

      const userGroups = req.user["cognito:groups"] || [];

      // Check if user has any of the allowed roles
      const hasRequiredRole = allowedRoles.some((role) => userGroups.includes(role));

      if (!hasRequiredRole) {
        logger.warn(
          `User ${req.user.email} attempted to access protected resource without required role. ` +
          `Required: ${allowedRoles.join(", ")}, User has: ${userGroups.join(", ") || "none"}`
        );
        res.status(403).json({
          message: "Forbidden - Insufficient permissions",
          requiredRoles: allowedRoles,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error("Authorization error:", error);
      res.status(500).json({
        message: "Internal server error during authorization",
      });
      return;
    }
  };
}

