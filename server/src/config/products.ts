/**
 * Swagger definitions for /products route
 * Contains GET and POST endpoints
 */

export const productsDefinition = {
  "/products": {
    get: {
      operationId: "getProducts",
      summary: "Get a list of products",
      description: "Retrieve a paginated list of products with optional filtering, sorting, and search capabilities",
      tags: ["Products"],
      parameters: [
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
          description: "Search term for product name or description",
        },
        {
          in: "query",
          name: "min_price",
          schema: { type: "number", minimum: 0 },
          description: "Minimum price filter",
        },
        {
          in: "query",
          name: "max_price",
          schema: { type: "number", minimum: 0 },
          description: "Maximum price filter",
        },
        {
          in: "query",
          name: "manufacturer_id",
          schema: { type: "integer", minimum: 1 },
          description: "Filter by manufacturer ID",
        },
        {
          in: "query",
          name: "country_of_origin",
          schema: { type: "string" },
          description: "Filter by country of origin",
        },
        {
          in: "query",
          name: "in_stock",
          schema: { type: "boolean" },
          description: "Filter by stock availability",
        },
        {
          in: "query",
          name: "sort_by",
          schema: { type: "string", enum: ["name", "price", "created_at"], default: "created_at" },
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
          description: "List of products retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Product" },
              },
              example: [
                {
                  id: 1,
                  name: "Sample Product",
                  description: "A sample product description",
                  base_price: 29.99,
                  country_of_origin: "USA",
                  stock_quantity: 100,
                  manufacturer_id: 1,
                  images: [{ id: 1, url: "https://example.com/image.jpg", is_main: true }],
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
              example: {
                message: "Invalid query schema",
                errors: [{ path: ["limit"], message: "Number must be less than or equal to 100" }],
              },
            },
          },
        },
      },
    },
    post: {
      operationId: "createProduct",
      summary: "Create a new product",
      description: "Create a new product with optional images. The product will be assigned a unique ID upon creation. Requires admin or superadmin role.",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateProduct" },
            example: {
              name: "New Product",
              description: "A great new product",
              base_price: 49.99,
              country_of_origin: "USA",
              stock_quantity: 50,
              manufacturer_id: 1,
              images: [
                { url: "https://example.com/image1.jpg", is_main: true },
                { url: "https://example.com/image2.jpg", is_main: false },
              ],
            },
          },
        },
      },
      responses: {
        201: {
          description: "Product created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" },
              example: {
                id: 1,
                name: "New Product",
                description: "Product description",
                base_price: 49.99,
                country_of_origin: "USA",
                stock_quantity: 50,
                manufacturer_id: 1,
                images: [{ id: 1, url: "https://example.com/image.jpg", is_main: true }],
              },
            },
          },
        },
        400: {
          description: "Invalid request body",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Invalid body schema",
                errors: [{ path: ["name"], message: "Required" }],
              },
            },
          },
        },
        401: {
          description: "Unauthorized - Missing or invalid authentication token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Unauthorized - Missing or invalid authorization header",
              },
            },
          },
        },
        403: {
          description: "Forbidden - Insufficient permissions (admin or superadmin required)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Forbidden - Insufficient permissions",
                requiredRoles: ["admin", "superadmin"],
              },
            },
          },
        },
      },
    },
  },
};

