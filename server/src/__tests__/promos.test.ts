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

describe("Promos API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for admin user (for protected endpoints)
    vi.mocked(cognitoVerifier.verify).mockResolvedValue({
      sub: "admin-sub-123",
      email: "admin@example.com",
      "cognito:groups": ["admin"],
    } as any);
  });

  describe("GET /promos", () => {
    it("should return a list of promos with default pagination", async () => {
      const mockPromos = [
        {
          id: 1,
          code: "SAVE10",
          discount_type: "percentage",
          discount_value: "10.00",
          active_until: null,
        },
        {
          id: 2,
          code: "FIXED5",
          discount_type: "fixed",
          discount_value: "5.00",
          active_until: "2024-12-31T23:59:59Z",
        },
      ];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockPromos,
        rowCount: 2,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app).get("/promos");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 1,
        code: "SAVE10",
        discount_type: "percentage",
        discount_value: 10,
      });
    });

    it("should filter promos by code", async () => {
      const mockPromos = [
        {
          id: 1,
          code: "SAVE10",
          discount_type: "percentage",
          discount_value: "10.00",
          active_until: null,
        },
      ];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockPromos,
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/promos")
        .query({ code: "SAVE10" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(databaseModel.query).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        expect.arrayContaining([expect.stringContaining("SAVE10")])
      );
    });

    it("should filter promos by active status", async () => {
      const mockPromos: any[] = [];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockPromos,
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/promos")
        .query({ active: true });

      expect(response.status).toBe(200);
      expect(databaseModel.query).toHaveBeenCalledWith(
        expect.stringContaining("active_until"),
        expect.any(Array)
      );
    });

    it("should filter promos by discount_type", async () => {
      const mockPromos = [
        {
          id: 1,
          code: "SAVE10",
          discount_type: "percentage",
          discount_value: "10.00",
          active_until: null,
        },
      ];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockPromos,
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/promos")
        .query({ discount_type: "percentage" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("should support pagination with page and limit", async () => {
      const mockPromos: any[] = [];

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: mockPromos,
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get("/promos")
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(databaseModel.query).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT"),
        expect.arrayContaining([10, 10])
      );
    });

    it("should validate query parameters and return 400 for invalid data", async () => {
      const response = await request(app)
        .get("/promos")
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("GET /promos/:id", () => {
    it("should return a promo by ID", async () => {
      const mockPromo = {
        id: 1,
        code: "SAVE10",
        discount_type: "percentage",
        discount_value: "10.00",
        active_until: null,
      };

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [mockPromo],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app).get("/promos/1");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        code: "SAVE10",
        discount_type: "percentage",
        discount_value: 10,
      });
    });

    it("should return 404 when promo does not exist", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app).get("/promos/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });
  });

  describe("POST /promos", () => {
    it("should create a new promo successfully", async () => {
      const newPromo = {
        code: "NEWCODE",
        discount_type: "percentage",
        discount_value: 15,
      };

      // Mock the INSERT query (returns promo ID)
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      // Mock the SELECT query to fetch the created promo
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            code: "NEWCODE",
            discount_type: "percentage",
            discount_value: "15.00",
            active_until: null,
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/promos")
        .set("Authorization", "Bearer admin-token")
        .send(newPromo);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 1,
        code: "NEWCODE",
        discount_type: "percentage",
        discount_value: 15,
      });
    });

    it("should create a promo with active_until date", async () => {
      const newPromo = {
        code: "EXPIRES",
        discount_type: "fixed",
        discount_value: 20,
        active_until: "2024-12-31T23:59:59Z",
      };

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 2 }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            code: "EXPIRES",
            discount_type: "fixed",
            discount_value: "20.00",
            active_until: "2024-12-31T23:59:59Z",
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post("/promos")
        .set("Authorization", "Bearer admin-token")
        .send(newPromo);

      expect(response.status).toBe(201);
      expect(response.body.code).toBe("EXPIRES");
    });

    it("should return 400 for invalid promo data", async () => {
      const invalidPromo = {
        code: "",
        discount_type: "invalid",
        discount_value: -10,
      };

      const response = await request(app)
        .post("/promos")
        .set("Authorization", "Bearer admin-token")
        .send(invalidPromo);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 when code exceeds max length", async () => {
      const invalidPromo = {
        code: "a".repeat(51),
        discount_type: "percentage",
        discount_value: 10,
      };

      const response = await request(app)
        .post("/promos")
        .set("Authorization", "Bearer admin-token")
        .send(invalidPromo);

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /promos/:id", () => {
    it("should update a promo successfully", async () => {
      const updateData = {
        code: "UPDATED",
        discount_value: 25,
      };

      // Mock checkPromoExists
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

      // Mock SELECT to fetch updated promo
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            code: "UPDATED",
            discount_type: "percentage",
            discount_value: "25.00",
            active_until: null,
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/promos/1")
        .set("Authorization", "Bearer admin-token")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe("UPDATED");
      expect(response.body.discount_value).toBe(25);
    });

    it("should return 404 when promo does not exist", async () => {
      const updateData = {
        code: "UPDATED",
      };

      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/promos/999")
        .set("Authorization", "Bearer admin-token")
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when no fields are provided", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .patch("/promos/1")
        .set("Authorization", "Bearer admin-token")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("DELETE /promos/:id", () => {
    it("should delete a promo successfully", async () => {
      // Mock checkPromoExists
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
        .delete("/promos/1")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it("should return 404 when promo does not exist", async () => {
      vi.mocked(databaseModel.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete("/promos/999")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });
  });
});










