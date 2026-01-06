/**
 * Swagger definitions for /promos route
 * Contains GET and POST endpoints
 */

export const promosDefinition = {
  "/promos": {
    get: {
      operationId: "getPromos",
      summary: "Get a list of promo codes",
      description: "Retrieve a paginated list of promo codes with optional filtering and sorting",
      tags: ["Promos"],
      parameters: [
        {
          in: "query",
          name: "code",
          schema: { type: "string" },
          description: "Search term for promo code",
        },
        {
          in: "query",
          name: "active",
          schema: { type: "boolean" },
          description: "Filter by active status (checks if active_until is null or in the future)",
        },
        {
          in: "query",
          name: "discount_type",
          schema: { type: "string", enum: ["percentage", "fixed"] },
          description: "Filter by discount type",
        },
        {
          in: "query",
          name: "sort_by",
          schema: { type: "string", enum: ["code", "discount_value", "active_until"], default: "code" },
          description: "Field to sort by",
        },
        {
          in: "query",
          name: "order",
          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
          description: "Sort order",
        },
        {
          in: "query",
          name: "page",
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "Page number",
        },
        {
          in: "query",
          name: "limit",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          description: "Number of items per page",
        },
      ],
      responses: {
        200: {
          description: "List of promos retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Promo" },
              },
              example: [
                {
                  id: 1,
                  code: "SAVE10",
                  discount_type: "percentage",
                  discount_value: 10,
                  active_until: null,
                },
                {
                  id: 2,
                  code: "FIXED5",
                  discount_type: "fixed",
                  discount_value: 5,
                  active_until: "2024-12-31T23:59:59Z",
                },
              ],
            },
          },
        },
        400: {
          description: "Invalid query parameters",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    post: {
      operationId: "createPromo",
      summary: "Create a new promo code",
      description: "Create a new promo code with discount type and value. Requires admin or superadmin role.",
      tags: ["Promos"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePromo" },
            example: {
              code: "SAVE20",
              discount_type: "percentage",
              discount_value: 20,
              active_until: "2024-12-31T23:59:59Z",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Promo created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Promo" },
              example: {
                id: 1,
                code: "SAVE20",
                discount_type: "percentage",
                discount_value: 20,
                active_until: "2024-12-31T23:59:59Z",
              },
            },
          },
        },
        400: {
          description: "Invalid request body",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
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
      },
    },
  },
};




