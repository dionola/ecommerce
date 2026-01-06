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

describe("Carts API Endpoints", () => {
  const mockUser = {
    sub: "user-sub-123",
    email: "user@example.com",
    "cognito:groups": [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cognitoVerifier.verify).mockResolvedValue(mockUser as any);
  });

  describe("GET /carts", () => {
    it("should return user's cart with items and totals", async () => {
      // Mock getUserIdByCognitoSub
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock getOrCreateCart
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock cart info query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, updated_at: new Date() }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock items query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            quantity: 2,
            product_id: 1,
            name: "Product 1",
            description: "Description 1",
            base_price: "100.00",
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
        .get("/carts")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("user_id");
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("subtotal");
      expect(response.body).toHaveProperty("total");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/carts");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /carts/items", () => {
    it("should add an item to cart", async () => {
      // Mock getUserIdByCognitoSub
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock getOrCreateCart
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock checkProductExists
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock validateStock
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock getCartItemByProductId (item doesn't exist)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock INSERT cart item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock updateCartTimestamp
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      // Mock cart info query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, updated_at: new Date() }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock items query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            quantity: 1,
            product_id: 1,
            name: "Product 1",
            description: "Description 1",
            base_price: "100.00",
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
        .post("/carts/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 1, quantity: 1 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("items");
    });

    it("should update quantity if item already exists in cart", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock getCartItemByProductId (item exists)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, quantity: 2 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock validateStock for new quantity
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock UPDATE cart item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, updated_at: new Date() }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            quantity: 3,
            product_id: 1,
            name: "Product 1",
            base_price: "100.00",
            images: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/carts/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 1, quantity: 1 });

      expect(response.status).toBe(201);
    });

    it("should return 404 when product does not exist", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock checkProductExists (returns no rows)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/carts/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 999, quantity: 1 });

      expect(response.status).toBe(404);
    });

    it("should return 404 when insufficient stock", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock validateStock (insufficient stock)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ stock_quantity: 5 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/carts/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 1, quantity: 10 });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Insufficient stock");
    });
  });

  describe("PATCH /carts/items/:itemId", () => {
    it("should update cart item quantity", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock get cart item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, product_id: 1, cart_id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock validateStock
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock UPDATE cart item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      // Mock updateCartTimestamp
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, updated_at: new Date() }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/carts/items/1")
        .set("Authorization", "Bearer user-token")
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
    });

    it("should return 404 when cart item does not exist", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock get cart item (returns no rows)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/carts/items/999")
        .set("Authorization", "Bearer user-token")
        .send({ quantity: 5 });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /carts/items/:itemId", () => {
    it("should remove an item from cart", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock get cart item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, cart_id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock DELETE cart item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

      // Mock updateCartTimestamp
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, updated_at: new Date() }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/carts/items/1")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /carts/clear", () => {
    it("should clear all items from cart", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock get cart
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock DELETE all cart items
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 2,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

      // Mock updateCartTimestamp
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, updated_at: new Date() }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/carts/clear")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
    });
  });
});




