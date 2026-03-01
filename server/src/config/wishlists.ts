/**
 * Swagger definitions for /wishlists routes
 */

export const wishlistsDefinition = {
  "/wishlists": {
    get: {
      operationId: "getWishlist",
      summary: "Get user's wishlist",
      description: "Retrieve the authenticated user's wishlist with all items. Each user has one wishlist that is automatically created on first item addition.",
      tags: ["Wishlists"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Wishlist retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Wishlist" },
              example: {
                id: 1,
                user_id: 1,
                items: [
                  {
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
                  },
                ],
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
  "/wishlists/items": {
    post: {
      operationId: "addWishlistItem",
      summary: "Add item to wishlist",
      description: "Add a product to the authenticated user's wishlist. If the wishlist doesn't exist, it will be created automatically.",
      tags: ["Wishlists"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddWishlistItem" },
            example: {
              product_id: 1,
            },
          },
        },
      },
      responses: {
        201: {
          description: "Item added to wishlist successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Wishlist" },
            },
          },
        },
        400: {
          description: "Product already exists in wishlist",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Product already exists in wishlist",
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
          description: "Product not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { message: "Product with id 999 not found" },
            },
          },
        },
      },
    },
    delete: {
      operationId: "removeWishlistItem",
      summary: "Remove item from wishlist",
      description: "Remove a product from the authenticated user's wishlist",
      tags: ["Wishlists"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RemoveWishlistItem" },
            example: {
              product_id: 1,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Item removed from wishlist successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Wishlist" },
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
          description: "Product not found in wishlist",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { message: "Product with id 999 not found in wishlist" },
            },
          },
        },
      },
    },
  },
  "/wishlists/clear": {
    delete: {
      operationId: "clearWishlist",
      summary: "Clear wishlist",
      description: "Remove all items from the authenticated user's wishlist",
      tags: ["Wishlists"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Wishlist cleared successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Wishlist" },
              example: {
                id: 1,
                user_id: 1,
                items: [],
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










