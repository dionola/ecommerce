/**
 * Swagger definitions for /orders routes
 */

export const ordersDefinition = {
  "/orders": {
    get: {
      operationId: "getOrders",
      summary: "Get orders",
      description: "Retrieve a paginated list of orders. Regular users see only their own orders. Admins can see all orders and filter by user_id.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "query",
          name: "status",
          schema: { type: "string" },
          description: "Filter by order status",
        },
        {
          in: "query",
          name: "user_id",
          schema: { type: "integer", minimum: 1 },
          description: "Filter by user ID (admin only)",
        },
        {
          in: "query",
          name: "sort_by",
          schema: { type: "string", enum: ["created_at", "total_amount", "status"], default: "created_at" },
          description: "Field to sort by",
        },
        {
          in: "query",
          name: "order",
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
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
          description: "List of orders retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Order" },
              },
              example: [
                {
                  id: 1,
                  user_id: 1,
                  total_amount: 99.99,
                  status: "pending",
                  promo_id: null,
                  payment_intent_id: null,
                  shipping_address: { street: "123 Main St", city: "City", zip: "12345" },
                  created_at: "2024-01-01T00:00:00Z",
                  items: [
                    {
                      id: 1,
                      product: {
                        id: 1,
                        name: "Sample Product",
                        base_price: 29.99,
                        images: [],
                      },
                      quantity: 2,
                      price_at_purchase: 29.99,
                    },
                  ],
                },
              ],
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
      },
    },
    post: {
      operationId: "createOrder",
      summary: "Create an order from cart",
      description: "Create a new order from the authenticated user's cart. This will validate stock, apply promo codes, snapshot product prices, update stock quantities, and clear the cart. Requires authentication.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateOrder" },
            example: {
              shipping_address: {
                street: "123 Main Street",
                city: "New York",
                state: "NY",
                zip: "10001",
                country: "USA",
              },
              promo_id: 1,
            },
          },
        },
      },
      responses: {
        201: {
          description: "Order created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Order" },
            },
          },
        },
        400: {
          description: "Invalid request body or empty cart",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Cannot create order from empty cart",
              },
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
        404: {
          description: "Product not found or insufficient stock",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/orders/{id}": {
    get: {
      operationId: "getOrderById",
      summary: "Get an order by ID",
      description: "Retrieve a single order by its ID. Regular users can only access their own orders. Admins can access any order.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Order ID",
        },
      ],
      responses: {
        200: {
          description: "Order retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Order" },
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
        404: {
          description: "Order not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { message: "Order with id 999 not found" },
            },
          },
        },
      },
    },
    patch: {
      operationId: "updateOrder",
      summary: "Update an order",
      description: "Update an order's status or payment intent ID. Regular users can only update their own orders. Admins can update any order.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Order ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateOrder" },
            example: {
              status: "completed",
              stripe_payment_intent_id: "pi_1234567890",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Order updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Order" },
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
        404: {
          description: "Order not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    delete: {
      operationId: "deleteOrder",
      summary: "Delete an order (Admin-only)",
      description: "Delete an order by ID. Only pending orders can be deleted. Requires admin or superadmin role.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Order ID",
        },
      ],
      responses: {
        204: {
          description: "Order deleted successfully",
        },
        400: {
          description: "Cannot delete order with non-pending status",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Cannot delete order with status: completed. Only pending orders can be deleted.",
              },
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
          description: "Order not found",
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




