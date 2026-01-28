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

describe("Wishlists API Endpoints", () => {
  const mockUser = {
    sub: "user-sub-123",
    email: "user@example.com",
    "cognito:groups": [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cognitoVerifier.verify).mockResolvedValue(mockUser as any);
  });

  describe("GET /wishlists", () => {
    it("should return user's wishlist with items", async () => {
      // Mock getUserIdByCognitoSub
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock getOrCreateWishlist
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock wishlist info query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1 }],
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
            name: "Product 1",
            description: "Description 1",
            base_price: "100.00",
            country_of_origin: "USA",
            stock_quantity: 10,
            manufacturer_id: 1,
            images: [{ id: 1, url: "http://example.com/image.jpg", is_main: true }],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/wishlists")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("user_id");
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/wishlists");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /wishlists/items", () => {
    it("should add an item to wishlist", async () => {
      // Mock getUserIdByCognitoSub
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock getOrCreateWishlist
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

      // Mock checkWishlistItemExists (returns empty - item doesn't exist)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock INSERT wishlist item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock wishlist info query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1 }],
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
        .post("/wishlists/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 1 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("items");
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it("should return 400 when product already exists in wishlist", async () => {
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

      // Mock checkWishlistItemExists (returns item exists)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/wishlists/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 1 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("already exists");
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
        .post("/wishlists/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 999 });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /wishlists/items", () => {
    it("should remove an item from wishlist", async () => {
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

      // Mock checkWishlistItemExists (item exists)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock DELETE wishlist item
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

      // Mock wishlist info query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock items query (empty after deletion)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/wishlists/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
    });

    it("should return 404 when item does not exist in wishlist", async () => {
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

      // Mock checkWishlistItemExists (item doesn't exist)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/wishlists/items")
        .set("Authorization", "Bearer user-token")
        .send({ product_id: 999 });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /wishlists/clear", () => {
    it("should clear all items from wishlist", async () => {
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

      // Mock DELETE all wishlist items
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 2,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

      // Mock wishlist info query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock items query (empty after clear)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/wishlists/clear")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
    });
  });
});






