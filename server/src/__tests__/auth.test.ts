import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "./setup.js";
import * as databaseModel from "../../models/databaseModel.js";
import { cognitoVerifier } from "../../config/cognito.js";

// Mock the database model
vi.mock("../../models/databaseModel", () => ({
  query: vi.fn(),
}));

// Mock Cognito verifier
vi.mock("../../config/cognito", () => ({
  cognitoVerifier: {
    verify: vi.fn(),
  },
}));

describe("Authentication and Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /products (Optional Auth)", () => {
    it("should allow guest access without authentication", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Test Product",
          description: "Test Description",
          base_price: "100.00",
          country_of_origin: "USA",
          stock_quantity: 10,
          manufacturer_id: 1,
          images: [],
        },
      ];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app).get("/products");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      // Verify Cognito verifier was not called for guest access
      expect(cognitoVerifier.verify).not.toHaveBeenCalled();
    });

    it("should allow authenticated users with valid token", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Test Product",
          description: null,
          base_price: "100.00",
          country_of_origin: null,
          stock_quantity: 10,
          manufacturer_id: 1,
          images: [],
        },
      ];

      const mockUser = {
        sub: "test-sub-123",
        email: "user@example.com",
        "cognito:groups": [],
      };

      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/products")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(cognitoVerifier.verify).toHaveBeenCalledWith("valid-token");
    });

    it("should allow guest access with invalid token (graceful degradation)", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Test Product",
          description: null,
          base_price: "100.00",
          country_of_origin: null,
          stock_quantity: 10,
          manufacturer_id: 1,
          images: [],
        },
      ];

      vi.mocked(cognitoVerifier.verify).mockRejectedValueOnce(
        new Error("Invalid token")
      );
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/products")
        .set("Authorization", "Bearer invalid-token");

      // Should still allow access as guest
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe("POST /products (Required Auth)", () => {
    it("should return 401 when no authorization header is provided", async () => {
      const newProduct = {
        name: "New Product",
        base_price: 99.99,
      };

      const response = await request(app).post("/products").send(newProduct);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Unauthorized");
      expect(cognitoVerifier.verify).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is invalid format", async () => {
      const newProduct = {
        name: "New Product",
        base_price: 99.99,
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", "InvalidFormat token")
        .send(newProduct);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should return 401 when token is invalid or expired", async () => {
      const newProduct = {
        name: "New Product",
        base_price: 99.99,
      };

      vi.mocked(cognitoVerifier.verify).mockRejectedValueOnce(
        new Error("Invalid token")
      );

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer invalid-token")
        .send(newProduct);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Unauthorized");
      expect(cognitoVerifier.verify).toHaveBeenCalledWith("invalid-token");
    });

    it("should return 403 when user lacks required role (admin/superadmin)", async () => {
      const newProduct = {
        name: "New Product",
        base_price: 99.99,
      };

      const mockUser = {
        sub: "test-sub-123",
        email: "user@example.com",
        "cognito:groups": [], // No admin/superadmin groups
      };

      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer valid-token")
        .send(newProduct);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Forbidden");
      expect(response.body).toHaveProperty("requiredRoles");
      expect(response.body.requiredRoles).toContain("admin");
    });

    it("should allow admin user to create product", async () => {
      const newProduct = {
        name: "New Product",
        base_price: 99.99,
      };

      const mockUser = {
        sub: "admin-sub-123",
        email: "admin@example.com",
        "cognito:groups": ["admin"],
      };

      // Override default mock for this test
      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);

      // Mock database operations - INSERT product (returns id)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Note: insertProductImages is skipped when images array is empty, so no mock needed

      // Mock SELECT to fetch created product (fetchProductWithImages - uses JOIN query)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "New Product",
            description: null,
            base_price: "99.99",
            country_of_origin: null,
            stock_quantity: 0,
            manufacturer_id: null,
            images: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer admin-token")
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("New Product");
    });

    it("should allow superadmin user to create product", async () => {
      const newProduct = {
        name: "New Product",
        base_price: 99.99,
      };

      const mockUser = {
        sub: "superadmin-sub-123",
        email: "superadmin@example.com",
        "cognito:groups": ["superadmin"],
      };

      // Override default mock for this test
      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);

      // Mock database operations - INSERT product (returns id)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Note: insertProductImages is skipped when images array is empty, so no mock needed

      // Mock SELECT to fetch created product (fetchProductWithImages - uses JOIN query)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "New Product",
            description: null,
            base_price: "99.99",
            country_of_origin: null,
            stock_quantity: 0,
            manufacturer_id: null,
            images: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer superadmin-token")
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("New Product");
    });
  });

  describe("PATCH /products/:id (Required Auth)", () => {
    it("should return 401 when no authorization header is provided", async () => {
      const updateData = {
        name: "Updated Product",
      };

      const response = await request(app)
        .patch("/products/1")
        .send(updateData);

      expect(response.status).toBe(401);
    });

    it("should return 403 when user lacks required role", async () => {
      const updateData = {
        name: "Updated Product",
      };

      const mockUser = {
        sub: "test-sub-123",
        email: "user@example.com",
        "cognito:groups": [],
      };

      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);

      const response = await request(app)
        .patch("/products/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Forbidden");
    });

    it("should allow admin user to update product", async () => {
      const updateData = {
        name: "Updated Product",
      };

      const mockUser = {
        sub: "admin-sub-123",
        email: "admin@example.com",
        "cognito:groups": ["admin"],
      };

      // Override default mock for this test
      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);

      // Mock checkProductExists
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock UPDATE
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      // Mock SELECT to fetch updated product (fetchProductWithImages)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "Updated Product",
            description: null,
            base_price: "100.00",
            country_of_origin: null,
            stock_quantity: 10,
            manufacturer_id: null,
            images: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/products/1")
        .set("Authorization", "Bearer admin-token")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Product");
    });
  });

  describe("DELETE /products/:id (Required Auth)", () => {
    it("should return 401 when no authorization header is provided", async () => {
      const response = await request(app).delete("/products/1");

      expect(response.status).toBe(401);
    });

    it("should return 403 when user lacks required role", async () => {
      const mockUser = {
        sub: "test-sub-123",
        email: "user@example.com",
        "cognito:groups": [],
      };

      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);

      const response = await request(app)
        .delete("/products/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Forbidden");
    });

    it("should allow admin user to delete product", async () => {
      const mockUser = {
        sub: "admin-sub-123",
        email: "admin@example.com",
        "cognito:groups": ["admin"],
      };

      vi.mocked(cognitoVerifier.verify).mockResolvedValueOnce(mockUser as any);

      // Mock database operations
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/products/1")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(204);
    });
  });
});

