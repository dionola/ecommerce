import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "./setup";
import * as databaseModel from "../../models/databaseModel";
import { cognitoVerifier } from "../../config/cognito";

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

describe("Products API Endpoints", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for admin user (for protected endpoints)
    vi.mocked(cognitoVerifier.verify).mockResolvedValue({
      sub: "admin-sub-123",
      email: "admin@example.com",
      "cognito:groups": ["admin"],
    } as any);
  });

  describe("GET /products", () => {
    it("should return a list of products with default pagination", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Test Product 1",
          description: "Test Description 1",
          base_price: "100.00",
          country_of_origin: "USA",
          stock_quantity: 10,
          manufacturer_id: 1,
          images: [
            { id: 1, url: "http://example.com/image1.jpg", is_main: true },
          ],
        },
        {
          id: 2,
          name: "Test Product 2",
          description: "Test Description 2",
          base_price: "200.00",
          country_of_origin: null,
          stock_quantity: 5,
          manufacturer_id: null,
          images: [],
        },
      ];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 2,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app).get("/products");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 1,
        name: "Test Product 1",
        base_price: 100,
        stock_quantity: 10,
      });
    });

    it("should filter products by search query", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Laptop",
          description: "Gaming laptop",
          base_price: "1000.00",
          country_of_origin: "USA",
          stock_quantity: 5,
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

      const response = await request(app)
        .get("/products")
        .query({ search: "laptop" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(databaseModel.query).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        expect.arrayContaining([expect.stringContaining("laptop")])
      );
    });

    it("should filter products by price range", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Product",
          description: null,
          base_price: "150.00",
          country_of_origin: null,
          stock_quantity: 10,
          manufacturer_id: null,
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

      const response = await request(app)
        .get("/products")
        .query({ min_price: 100, max_price: 200 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("should filter products by manufacturer_id", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Product",
          description: null,
          base_price: "100.00",
          country_of_origin: null,
          stock_quantity: 10,
          manufacturer_id: 5,
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

      const response = await request(app)
        .get("/products")
        .query({ manufacturer_id: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("should filter products by in_stock", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Product",
          description: null,
          base_price: "100.00",
          country_of_origin: null,
          stock_quantity: 10,
          manufacturer_id: null,
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

      const response = await request(app)
        .get("/products")
        .query({ in_stock: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("should support pagination with page and limit", async () => {
      const mockProducts: any[] = [];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/products")
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
      expect(databaseModel.query).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT"),
        expect.arrayContaining([10, 10]) // limit=10, offset=10 (page 2)
      );
    });

    it("should support sorting by name, price, or created_at", async () => {
      const mockProducts: any[] = [];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/products")
        .query({ sort_by: "name", order: "asc" });

      expect(response.status).toBe(200);
      expect(databaseModel.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY p.name ASC"),
        expect.any(Array)
      );
    });

    it("should validate query parameters and return 400 for invalid data", async () => {
      const response = await request(app)
        .get("/products")
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });

    it("should validate limit max value (100)", async () => {
      const response = await request(app)
        .get("/products")
        .query({ limit: 101 });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /products", () => {
    it("should create a new product successfully", async () => {
      const newProduct = {
        name: "New Product",
        description: "Product description",
        base_price: 99.99,
        country_of_origin: "USA",
        stock_quantity: 50,
        manufacturer_id: 1,
        images: [
          { url: "http://example.com/image.jpg", is_main: true },
        ],
      };

      // Mock the INSERT query (returns product ID)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock the image INSERT query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock the SELECT query to fetch the created product
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "New Product",
            description: "Product description",
            base_price: "99.99",
            country_of_origin: "USA",
            stock_quantity: 50,
            manufacturer_id: 1,
            images: [
              { id: 1, url: "http://example.com/image.jpg", is_main: true },
            ],
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
      expect(response.body).toMatchObject({
        id: 1,
        name: "New Product",
        base_price: 99.99,
        stock_quantity: 50,
      });
      expect(response.body.images).toHaveLength(1);
    });

    it("should create a product with minimal required fields", async () => {
      const newProduct = {
        name: "Minimal Product",
        base_price: 50,
      };

      // Mock INSERT
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 2 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock SELECT
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            name: "Minimal Product",
            description: null,
            base_price: "50.00",
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
      expect(response.body.name).toBe("Minimal Product");
      expect(response.body.stock_quantity).toBe(0);
    });

    it("should return 400 for invalid product data", async () => {
      const invalidProduct = {
        name: "", // Empty name should fail
        base_price: -10, // Negative price should fail
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer admin-token")
        .send(invalidProduct);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 when name exceeds max length", async () => {
      const invalidProduct = {
        name: "a".repeat(256), // Exceeds 255 character limit
        base_price: 100,
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer admin-token")
        .send(invalidProduct);

      expect(response.status).toBe(400);
    });

    it("should handle product creation with multiple images", async () => {
      const newProduct = {
        name: "Product with Images",
        base_price: 200,
        images: [
          { url: "http://example.com/image1.jpg", is_main: true },
          { url: "http://example.com/image2.jpg", is_main: false },
        ],
      };

      // Mock INSERT
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 3 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock image INSERT
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock SELECT
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 3,
            name: "Product with Images",
            description: null,
            base_price: "200.00",
            country_of_origin: null,
            stock_quantity: 0,
            manufacturer_id: null,
            images: [
              { id: 1, url: "http://example.com/image1.jpg", is_main: true },
              { id: 2, url: "http://example.com/image2.jpg", is_main: false },
            ],
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
      expect(response.body.images).toHaveLength(2);
    });
  });

  describe("PATCH /products/:id", () => {
    it("should update a product successfully", async () => {
      const updateData = {
        name: "Updated Product Name",
        base_price: 150,
      };

      // Mock checkProductExists (SELECT id)
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

      // Mock SELECT to fetch updated product
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "Updated Product Name",
            description: "Original description",
            base_price: "150.00",
            country_of_origin: "USA",
            stock_quantity: 10,
            manufacturer_id: 1,
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
      expect(response.body.name).toBe("Updated Product Name");
      expect(response.body.base_price).toBe(150);
    });

    it("should update multiple fields", async () => {
      const updateData = {
        name: "Updated Name",
        description: "Updated description",
        stock_quantity: 25,
      };

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

      // Mock SELECT
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "Updated Name",
            description: "Updated description",
            base_price: "100.00",
            country_of_origin: null,
            stock_quantity: 25,
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
      expect(response.body.name).toBe("Updated Name");
      expect(response.body.description).toBe("Updated description");
      expect(response.body.stock_quantity).toBe(25);
    });

    it("should return 404 when product does not exist", async () => {
      const updateData = {
        name: "Updated Name",
      };

      // Mock checkProductExists (returns no rows)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/products/999")
        .set("Authorization", "Bearer admin-token")
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .patch("/products/invalid")
        .set("Authorization", "Bearer admin-token")
        .send({ name: "Test" });

      expect(response.status).toBe(400);
    });

    it("should return 400 when no fields are provided", async () => {
      // Mock checkProductExists
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/products/1")
        .set("Authorization", "Bearer admin-token")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for invalid update data", async () => {
      const invalidData = {
        base_price: -10, // Negative price should fail
      };

      const response = await request(app)
        .patch("/products/1")
        .set("Authorization", "Bearer admin-token")
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /products/:id", () => {
    it("should delete a product successfully", async () => {
      // Mock checkProductExists
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock DELETE
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
      expect(response.body).toEqual({});
    });

    it("should return 404 when product does not exist", async () => {
      // Mock checkProductExists (returns no rows)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/products/999")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .delete("/products/invalid")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(400);
    });

    it("should return 400 for negative product ID", async () => {
      const response = await request(app)
        .delete("/products/-1")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(400);
    });
  });
});

