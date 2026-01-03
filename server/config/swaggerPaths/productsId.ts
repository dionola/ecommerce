/**
 * Swagger definitions for /products/{id} route
 * Contains PATCH and DELETE endpoints
 */

export const productsIdDefinition = {
  "/products/{id}": {
    patch: {
      operationId: "updateProduct",
      summary: "Update a product",
      description: "Partially update a product by ID. Only provided fields will be updated. At least one field must be provided.",
      tags: ["Products"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Product ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateProduct" },
            example: {
              name: "Updated Product Name",
              base_price: 59.99,
              stock_quantity: 75,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Product updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" },
              example: {
                id: 1,
                name: "Updated Product Name",
                description: "Updated description",
                base_price: 59.99,
                country_of_origin: "Canada",
                stock_quantity: 75,
                manufacturer_id: 2,
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
                errors: [{ path: [], message: "At least one field must be provided for update" }],
              },
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
      operationId: "deleteProduct",
      summary: "Delete a product",
      description: "Delete a product by ID. This will also cascade delete all associated product images.",
      tags: ["Products"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Product ID",
        },
      ],
      responses: {
        204: {
          description: "Product deleted successfully",
          content: {
            "application/json": {
              schema: { type: "object" },
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
  },
};

