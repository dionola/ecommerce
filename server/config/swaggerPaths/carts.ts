/**
 * Swagger definitions for /carts routes
 */

export const cartsDefinition = {
  "/carts": {
    get: {
      operationId: "getCart",
      summary: "Get user's cart",
      description: "Retrieve the authenticated user's cart with all items, subtotal, and total. Each user has one cart that is automatically created on first item addition.",
      tags: ["Carts"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cart retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Cart" },
              example: {
                id: 1,
                user_id: 1,
                updated_at: "2024-01-01T00:00:00Z",
                items: [
                  {
                    id: 1,
                    product: {
                      id: 1,
                      name: "Sample Product",
                      description: "A sample product",
                      base_price: 29.99,
                      country_of_origin: "USA",
                      stock_quantity: 100,
                      manufacturer_id: 1,
                      images: [{ id: 1, url: "https://example.com/image.jpg", is_main: true }],
                    },
                    quantity: 2,
                  },
                ],
                subtotal: 59.98,
                total: 59.98,
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
      },
    },
  },
  "/carts/items": {
    post: {
      operationId: "addCartItem",
      summary: "Add item to cart",
      description: "Add a product to the authenticated user's cart. If the cart doesn't exist, it will be created automatically. If the product already exists in the cart, the quantity will be updated.",
      tags: ["Carts"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddCartItem" },
            example: {
              product_id: 1,
              quantity: 2,
            },
          },
        },
      },
      responses: {
        201: {
          description: "Item added to cart successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Cart" },
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
              example: { message: "Insufficient stock. Available: 5, Requested: 10" },
            },
          },
        },
      },
    },
  },
  "/carts/items/{itemId}": {
    patch: {
      operationId: "updateCartItem",
      summary: "Update cart item quantity",
      description: "Update the quantity of a specific item in the authenticated user's cart",
      tags: ["Carts"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Cart item ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCartItem" },
            example: {
              quantity: 5,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Cart item updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Cart" },
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
          description: "Cart item not found or insufficient stock",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    delete: {
      operationId: "removeCartItem",
      summary: "Remove item from cart",
      description: "Remove a specific item from the authenticated user's cart",
      tags: ["Carts"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Cart item ID",
        },
      ],
      responses: {
        200: {
          description: "Item removed from cart successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Cart" },
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
          description: "Cart item not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/carts/clear": {
    delete: {
      operationId: "clearCart",
      summary: "Clear cart",
      description: "Remove all items from the authenticated user's cart",
      tags: ["Carts"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cart cleared successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Cart" },
              example: {
                id: 1,
                user_id: 1,
                updated_at: "2024-01-01T00:00:00Z",
                items: [],
                subtotal: 0,
                total: 0,
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
      },
    },
  },
};



