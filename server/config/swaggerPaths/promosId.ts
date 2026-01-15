/**
 * Swagger definitions for /promos/{id} route
 * Contains GET, PATCH and DELETE endpoints
 */

export const promosIdDefinition = {
  "/promos/{id}": {
    get: {
      operationId: "getPromoById",
      summary: "Get a promo code by ID",
      description: "Retrieve a single promo code by its ID",
      tags: ["Promos"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Promo ID",
        },
      ],
      responses: {
        200: {
          description: "Promo retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Promo" },
              example: {
                id: 1,
                code: "SAVE10",
                discount_type: "percentage",
                discount_value: 10,
                active_until: null,
              },
            },
          },
        },
        404: {
          description: "Promo not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { message: "Promo with id 999 not found" },
            },
          },
        },
      },
    },
    patch: {
      operationId: "updatePromo",
      summary: "Update a promo code",
      description: "Partially update a promo code by ID. Only provided fields will be updated. At least one field must be provided. Requires admin or superadmin role.",
      tags: ["Promos"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Promo ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdatePromo" },
            example: {
              code: "UPDATED_CODE",
              discount_value: 25,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Promo updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Promo" },
              example: {
                id: 1,
                code: "UPDATED_CODE",
                discount_type: "percentage",
                discount_value: 25,
                active_until: null,
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
        404: {
          description: "Promo not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { message: "Promo with id 999 not found" },
            },
          },
        },
      },
    },
    delete: {
      operationId: "deletePromo",
      summary: "Delete a promo code",
      description: "Delete a promo code by ID. Requires admin or superadmin role.",
      tags: ["Promos"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Promo ID",
        },
      ],
      responses: {
        204: {
          description: "Promo deleted successfully",
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
        404: {
          description: "Promo not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { message: "Promo with id 999 not found" },
            },
          },
        },
      },
    },
  },
};





