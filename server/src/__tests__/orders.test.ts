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

describe("Orders API Endpoints", () => {
  const mockUser = {
    sub: "user-sub-123",
    email: "user@example.com",
    "cognito:groups": [],
  };

  const mockAdmin = {
    sub: "admin-sub-123",
    email: "admin@example.com",
    "cognito:groups": ["admin"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cognitoVerifier.verify).mockResolvedValue(mockUser as any);
  });

  describe("GET /orders", () => {
    it("should return user's orders", async () => {
      // Mock getUserIdByCognitoSub
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock get orders query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "100.00",
            status: "pending",
            promo_id: null,
            stripe_payment_intent_id: null,
            shipping_address: { street: "123 Main St" },
            created_at: new Date(),
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock fetchOrderById for each order
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "100.00",
            status: "pending",
            promo_id: null,
            stripe_payment_intent_id: null,
            shipping_address: { street: "123 Main St" },
            created_at: new Date(),
            items: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/orders")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should allow admin to see all orders", async () => {
      vi.mocked(cognitoVerifier.verify).mockResolvedValue(mockAdmin as any);

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "100.00",
            status: "pending",
            promo_id: null,
            stripe_payment_intent_id: null,
            shipping_address: null,
            created_at: new Date(),
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "100.00",
            status: "pending",
            promo_id: null,
            stripe_payment_intent_id: null,
            shipping_address: null,
            created_at: new Date(),
            items: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/orders")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(200);
    });

    it("should filter orders by status", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
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
        .get("/orders")
        .set("Authorization", "Bearer user-token")
        .query({ status: "completed" });

      expect(response.status).toBe(200);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/orders");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /orders/:id", () => {
    it("should return an order by ID", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "100.00",
            status: "pending",
            promo_id: null,
            stripe_payment_intent_id: null,
            shipping_address: { street: "123 Main St" },
            created_at: new Date(),
            items: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/orders/1")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("items");
    });

    it("should return 404 when order does not exist", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
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
        .get("/orders/999")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /orders", () => {
    it("should create an order from cart", async () => {
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

      // Mock cart items query
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            quantity: 2,
            product_id: 1,
            name: "Product 1",
            base_price: "50.00",
            images: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock validateCartStock (check stock for each item)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock applyPromoDiscount (no promo)
      // Mock INSERT order
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock INSERT order items
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock UPDATE product stock
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      // Mock clearCart - get cart
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock clearCart - delete items
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

      // Mock clearCart - update timestamp
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      // Mock clearCart - fetch cart
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

      // Mock fetchOrderById
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "100.00",
            status: "pending",
            promo_id: null,
            stripe_payment_intent_id: null,
            shipping_address: { street: "123 Main St" },
            created_at: new Date(),
            items: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/orders")
        .set("Authorization", "Bearer user-token")
        .send({
          shipping_address: { street: "123 Main St", city: "City", zip: "12345" },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("status", "pending");
    });

    it("should return 400 when cart is empty", async () => {
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
        rows: [{ id: 1, user_id: 1, updated_at: new Date() }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock empty cart items
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/orders")
        .set("Authorization", "Bearer user-token")
        .send({
          shipping_address: { street: "123 Main St" },
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("empty cart");
    });

    it("should apply promo code when provided", async () => {
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
            quantity: 1,
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

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock applyPromoDiscount - get promo
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            discount_type: "percentage",
            discount_value: "10.00",
            active_until: null,
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "INSERT",
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

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "90.00",
            status: "pending",
            promo_id: 1,
            stripe_payment_intent_id: null,
            shipping_address: { street: "123 Main St" },
            created_at: new Date(),
            items: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/orders")
        .set("Authorization", "Bearer user-token")
        .send({
          shipping_address: { street: "123 Main St" },
          promo_id: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.promo_id).toBe(1);
    });
  });

  describe("PATCH /orders/:id", () => {
    it("should update order status", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock checkOrderExists
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock UPDATE order
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

      // Mock fetchOrderById
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            total_amount: "100.00",
            status: "completed",
            promo_id: null,
            stripe_payment_intent_id: null,
            shipping_address: null,
            created_at: new Date(),
            items: [],
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/orders/1")
        .set("Authorization", "Bearer user-token")
        .send({ status: "completed" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("completed");
    });
  });

  describe("DELETE /orders/:id", () => {
    it("should delete a pending order", async () => {
      // Mock checkOrderExists
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock check status
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ status: "pending" }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      // Mock DELETE order
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/orders/1")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(204);
    });

    it("should return 400 when trying to delete non-pending order", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ status: "completed" }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/orders/1")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Cannot delete order");
    });
  });
});






