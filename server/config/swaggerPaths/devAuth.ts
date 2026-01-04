/**
 * Swagger definitions for /dev/auth routes
 * Development-only endpoints for getting authentication tokens
 */

export const devAuthDefinition = {
  "/dev/auth/users": {
    get: {
      operationId: "listDevUsers",
      summary: "List available seeded users (Development Only)",
      description: "Returns a list of seeded users available for development testing. This endpoint is only available in non-production environments.",
      tags: ["Development"],
      responses: {
        200: {
          description: "List of available seeded users",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  users: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["user", "admin", "superadmin"] },
                        email: { type: "string" },
                        role: { type: "string" },
                      },
                    },
                  },
                  endpoint: { type: "string" },
                  example: { type: "string" },
                },
              },
              example: {
                message: "Available seeded users for development",
                users: [
                  { type: "user", email: "user@example.com", role: "Regular user" },
                  { type: "admin", email: "admin@example.com", role: "Admin" },
                  { type: "superadmin", email: "superadmin@example.com", role: "Superadmin" },
                ],
                endpoint: "/dev/auth/token/:userType",
                example: "/dev/auth/token/admin",
              },
            },
          },
        },
        404: {
          description: "Endpoint not available in production",
        },
      },
    },
  },
  "/dev/auth/token/{userType}": {
    get: {
      operationId: "getDevToken",
      summary: "Get authentication token for seeded user (Development Only)",
      description: "Authenticates with Cognito and returns a JWT token for the specified seeded user. Use this token in the Authorization header for protected endpoints. This endpoint is only available in non-production environments.",
      tags: ["Development"],
      parameters: [
        {
          in: "path",
          name: "userType",
          required: true,
          schema: {
            type: "string",
            enum: ["user", "admin", "superadmin"],
          },
          description: "Type of seeded user (user, admin, or superadmin)",
        },
      ],
      responses: {
        200: {
          description: "Token generated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: {
                    type: "string",
                    description: "JWT ID token to use in Authorization header",
                  },
                  userType: {
                    type: "string",
                    enum: ["user", "admin", "superadmin"],
                  },
                  email: { type: "string" },
                  expiresIn: {
                    type: "integer",
                    description: "Token expiration time in seconds",
                  },
                  message: { type: "string" },
                },
                required: ["token", "userType", "email"],
              },
              example: {
                token: "eyJraWQiOiJcL1wv...",
                userType: "admin",
                email: "admin@example.com",
                expiresIn: 3600,
                message: "Token generated for admin user. Use this token in the Authorization header as: Bearer eyJraWQiOiJcL1wv...",
              },
            },
          },
        },
        400: {
          description: "Invalid user type or user not confirmed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        401: {
          description: "Authentication failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        404: {
          description: "Endpoint not available in production",
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
};

