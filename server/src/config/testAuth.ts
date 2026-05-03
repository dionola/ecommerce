/**
 * Swagger definitions for test authentication endpoint
 * Development only - for getting test tokens for Swagger UI
 */

export const testAuthDefinition = {
  "/test-token": {
    post: {
      operationId: "getTestToken",
      summary: "Get test token for Swagger UI (Development Only)",
      description: `
        Get a JWT token for testing authenticated endpoints in Swagger UI.
        
        **This endpoint is only available in development mode.**
        
        **Use a valid development account from your connected Cognito user pool.**
        
        **How to use:**
        1. Call this endpoint with a test user's credentials
        2. Copy the \`token\` from the response
        3. Click the "Authorize" button at the top of Swagger UI
        4. Paste the token into the "Value" field
        5. Click "Authorize" then "Close"
        6. Now you can test all authenticated endpoints!
      `,
      tags: ["Testing"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  description: "Test user email",
                  example: "dev-admin@example.com",
                },
                password: {
                  type: "string",
                  description: "Test user password",
                  example: "YourDevPassword123!",
                },
              },
              required: ["email", "password"],
            },
            examples: {
              admin: {
                summary: "Development Admin User",
                value: {
                  email: "dev-admin@example.com",
                  password: "YourDevPassword123!",
                },
              },
            },
          },
        },
      },
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
                  expiresIn: {
                    type: "integer",
                    description: "Token expiration time in seconds",
                  },
                  user: {
                    type: "object",
                    properties: {
                      email: {
                        type: "string",
                      },
                      groups: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                        description: "User's Cognito groups (roles)",
                      },
                    },
                  },
                  instructions: {
                    type: "object",
                    description: "Step-by-step instructions for using the token",
                  },
                },
              },
              example: {
                token: "eyJraWQiOiJcL1wvY29nbml0by11c2VyLXBvb2xcL1VzZXJQb29sSWQiLCJhbGciOiJSUzI1NiJ9...",
                expiresIn: 3600,
                user: {
                  email: "dev-admin@example.com",
                  groups: ["admin"],
                },
                instructions: {
                  step1: "Copy the 'token' value above",
                  step2: "Click the 'Authorize' button at the top of the Swagger UI",
                  step3: "Paste the token into the 'Value' field",
                  step4: "Click 'Authorize' then 'Close'",
                  step5: "Now you can test authenticated endpoints!",
                },
              },
            },
          },
        },
        400: {
          description: "Missing email or password, or user not confirmed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Email and password are required",
              },
            },
          },
        },
        401: {
          description: "Invalid email or password",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Invalid email or password",
                hint: "Use a valid development user from your Cognito user pool",
              },
            },
          },
        },
        404: {
          description: "Endpoint not available in production",
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
