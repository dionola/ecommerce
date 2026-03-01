/**
 * Swagger definitions for /users routes
 * Admin-only user management endpoints
 */

export const usersDefinition = {
  "/users": {
    post: {
      operationId: "createUser",
      summary: "Create admin or superadmin user",
      description: `
        Create a new admin or superadmin user. Email verification is skipped for admin-created users.
        
        **Permission Rules:**
        - Admins can only create admin users
        - Superadmins can create both admin and superadmin users
        
        **Features:**
        - User is created in Cognito with email verified
        - User is added to appropriate Cognito group
        - User record is created in database
        - No verification email is sent
      `,
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUser" },
            examples: {
              createAdmin: {
                summary: "Create Admin User",
                value: {
                  email: "newadmin@example.com",
                  password: "SecurePassword123!",
                  fullName: "New Admin User",
                  role: "admin",
                },
              },
              createSuperadmin: {
                summary: "Create Superadmin User (Superadmin Only)",
                value: {
                  email: "newsuperadmin@example.com",
                  password: "SecurePassword123!",
                  fullName: "New Superadmin User",
                  role: "superadmin",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserResponse" },
              example: {
                id: 123,
                email: "newadmin@example.com",
                fullName: "New Admin User",
                role: "admin",
                cognitoSub: "123e4567-e89b-12d3-a456-426614174000",
              },
            },
          },
        },
        400: {
          description: "Invalid request body or permission denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              examples: {
                invalidBody: {
                  summary: "Invalid Request Body",
                  value: {
                    message: "Invalid body schema",
                    errors: [{ path: ["email"], message: "Invalid email format" }],
                  },
                },
                permissionDenied: {
                  summary: "Permission Denied",
                  value: {
                    message: "Admins can only create admin users. Superadmin role required to create superadmin users.",
                  },
                },
              },
            },
          },
        },
        401: {
          description: "Unauthorized - Missing or invalid authentication token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        403: {
          description: "Forbidden - Insufficient permissions (admin or superadmin required)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        409: {
          description: "User already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "User with email newadmin@example.com already exists",
              },
            },
          },
        },
      },
    },
  },
};

