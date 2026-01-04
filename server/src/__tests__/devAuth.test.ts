import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "./setup";
import * as databaseModel from "../../models/databaseModel";
import { cognitoClient, cognitoConfig } from "../../config/cognito";

// Mock the database model
vi.mock("../../models/databaseModel", () => ({
  query: vi.fn(),
}));

// Mock Cognito client
vi.mock("../../config/cognito", () => ({
  cognitoClient: {
    send: vi.fn(),
  },
  cognitoConfig: {
    userPoolId: "test-pool-id",
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    region: "us-east-1",
  },
}));

describe("Development Auth Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set NODE_ENV to development for these tests
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    // Restore original NODE_ENV
    delete process.env.NODE_ENV;
  });

  describe("GET /dev/auth/users", () => {
    it("should list available seeded users", async () => {
      const response = await request(app).get("/dev/auth/users");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
      expect(response.body.users).toHaveLength(3);
      expect(response.body.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "user",
            email: "user@example.com",
            role: "Regular user",
          }),
          expect.objectContaining({
            type: "admin",
            email: "admin@example.com",
            role: "Admin",
          }),
          expect.objectContaining({
            type: "superadmin",
            email: "superadmin@example.com",
            role: "Superadmin",
          }),
        ])
      );
      expect(response.body).toHaveProperty("endpoint");
      expect(response.body).toHaveProperty("example");
    });
  });

  describe("GET /dev/auth/token/:userType", () => {
    it("should return 400 for invalid user type", async () => {
      const response = await request(app).get("/dev/auth/token/invalid");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Invalid user type");
      expect(response.body).toHaveProperty("availableTypes");
    });

    it("should successfully get token for user type", async () => {
      const mockToken = "mock-jwt-token-123";
      const mockResponse = {
        AuthenticationResult: {
          IdToken: mockToken,
          ExpiresIn: 3600,
        },
      };

      vi.mocked(cognitoClient.send).mockResolvedValueOnce(mockResponse as any);

      const response = await request(app).get("/dev/auth/token/user");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token", mockToken);
      expect(response.body).toHaveProperty("userType", "user");
      expect(response.body).toHaveProperty("email", "user@example.com");
      expect(response.body).toHaveProperty("expiresIn", 3600);
      expect(cognitoClient.send).toHaveBeenCalled();
    });

    it("should successfully get token for admin type", async () => {
      const mockToken = "mock-jwt-token-admin";
      const mockResponse = {
        AuthenticationResult: {
          IdToken: mockToken,
          ExpiresIn: 3600,
        },
      };

      vi.mocked(cognitoClient.send).mockResolvedValueOnce(mockResponse as any);

      const response = await request(app).get("/dev/auth/token/admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token", mockToken);
      expect(response.body).toHaveProperty("userType", "admin");
      expect(response.body).toHaveProperty("email", "admin@example.com");
    });

    it("should successfully get token for superadmin type", async () => {
      const mockToken = "mock-jwt-token-superadmin";
      const mockResponse = {
        AuthenticationResult: {
          IdToken: mockToken,
          ExpiresIn: 3600,
        },
      };

      vi.mocked(cognitoClient.send).mockResolvedValueOnce(mockResponse as any);

      const response = await request(app).get("/dev/auth/token/superadmin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token", mockToken);
      expect(response.body).toHaveProperty("userType", "superadmin");
      expect(response.body).toHaveProperty("email", "superadmin@example.com");
    });

    it("should include SECRET_HASH when client secret is configured", async () => {
      const mockToken = "mock-jwt-token";
      const mockResponse = {
        AuthenticationResult: {
          IdToken: mockToken,
          ExpiresIn: 3600,
        },
      };

      vi.mocked(cognitoClient.send).mockResolvedValueOnce(mockResponse as any);

      await request(app).get("/dev/auth/token/user");

      // Verify the command was called
      expect(cognitoClient.send).toHaveBeenCalled();
      
      // Check that AuthParameters includes SECRET_HASH
      const callArgs = vi.mocked(cognitoClient.send).mock.calls[0][0] as any;
      const authParams = callArgs.input.AuthParameters;
      
      expect(authParams).toHaveProperty("SECRET_HASH");
      expect(authParams.USERNAME).toBe("user@example.com");
      expect(authParams.PASSWORD).toBe("TestUser123!");
      expect(authParams.SECRET_HASH).toBeTruthy();
    });

    it("should return 401 when authentication fails", async () => {
      const mockError = {
        name: "NotAuthorizedException",
        message: "Incorrect username or password",
      };

      vi.mocked(cognitoClient.send).mockRejectedValueOnce(mockError);

      const response = await request(app).get("/dev/auth/token/user");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Authentication failed");
    });

    it("should return 400 when user is not confirmed", async () => {
      const mockError = {
        name: "UserNotConfirmedException",
        message: "User is not confirmed",
      };

      vi.mocked(cognitoClient.send).mockRejectedValueOnce(mockError);

      const response = await request(app).get("/dev/auth/token/user");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not confirmed");
    });

    it("should return 500 when Cognito returns no token", async () => {
      const mockResponse = {
        AuthenticationResult: {},
      };

      vi.mocked(cognitoClient.send).mockResolvedValueOnce(mockResponse as any);

      const response = await request(app).get("/dev/auth/token/user");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Failed to get token");
    });

    it("should return 500 on unexpected Cognito errors", async () => {
      const mockError = {
        name: "InternalErrorException",
        message: "Internal server error",
      };

      vi.mocked(cognitoClient.send).mockRejectedValueOnce(mockError);

      const response = await request(app).get("/dev/auth/token/user");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Failed to authenticate");
    });
  });

  describe("SECRET_HASH generation", () => {
    it("should work without client secret when not configured", async () => {
      // Mock config without client secret
      const originalSecret = cognitoConfig.clientSecret;
      (cognitoConfig as any).clientSecret = undefined;

      const mockToken = "mock-jwt-token";
      const mockResponse = {
        AuthenticationResult: {
          IdToken: mockToken,
          ExpiresIn: 3600,
        },
      };

      vi.mocked(cognitoClient.send).mockResolvedValueOnce(mockResponse as any);

      const response = await request(app).get("/dev/auth/token/user");

      expect(response.status).toBe(200);
      
      // Verify SECRET_HASH was not included
      const callArgs = vi.mocked(cognitoClient.send).mock.calls[0][0] as any;
      const authParams = callArgs.input.AuthParameters;
      
      expect(authParams).not.toHaveProperty("SECRET_HASH");
      
      // Restore
      (cognitoConfig as any).clientSecret = originalSecret;
    });
  });
});

