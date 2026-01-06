/**
 * Swagger definitions for /manufacturers routes
 * Admin-only write operations
 */

export const manufacturersDefinition = {
  "/manufacturers": {
    get: {
      operationId: "getManufacturers",
      summary: "Get all manufacturers",
      description: "Retrieve a list of all manufacturers. Public endpoint.",
      tags: ["Manufacturers"],
      responses: {
        200: {
          description: "List of manufacturers retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Manufacturer" },
              },
              example: [
                { id: 1, name: "Apple" },
                { id: 2, name: "Samsung" },
                { id: 3, name: "Sony" },
              ],
            },
          },
        },
      },
    },
    post: {
      operationId: "createManufacturer",
      summary: "Create a manufacturer (Admin-only)",
      description: "Create a new manufacturer. Requires admin or superadmin role.",
      tags: ["Manufacturers"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateManufacturer" },
            example: {
              name: "New Manufacturer",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Manufacturer created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Manufacturer" },
              example: {
                id: 1,
                name: "New Manufacturer",
              },
            },
          },
        },
        400: {
          description: "Invalid request body or manufacturer already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              examples: {
                invalidBody: {
                  summary: "Invalid Request Body",
                  value: {
                    message: "Invalid body schema",
                    errors: [{ path: ["name"], message: "Name cannot be empty" }],
                  },
                },
                duplicate: {
                  summary: "Manufacturer Already Exists",
                  value: {
                    message: 'Manufacturer with name "New Manufacturer" already exists',
                  },
                },
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
      },
    },
  },
  "/manufacturers/{id}": {
    get: {
      operationId: "getManufacturerById",
      summary: "Get a manufacturer by ID",
      description: "Retrieve a single manufacturer by its ID. Public endpoint.",
      tags: ["Manufacturers"],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Manufacturer ID",
        },
      ],
      responses: {
        200: {
          description: "Manufacturer retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Manufacturer" },
              example: {
                id: 1,
                name: "Apple",
              },
            },
          },
        },
        404: {
          description: "Manufacturer not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Manufacturer with id 999 not found",
              },
            },
          },
        },
      },
    },
    patch: {
      operationId: "updateManufacturer",
      summary: "Update a manufacturer (Admin-only)",
      description: "Update a manufacturer's name. Requires admin or superadmin role.",
      tags: ["Manufacturers"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Manufacturer ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateManufacturer" },
            example: {
              name: "Updated Manufacturer Name",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Manufacturer updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Manufacturer" },
              example: {
                id: 1,
                name: "Updated Manufacturer Name",
              },
            },
          },
        },
        400: {
          description: "Invalid request body or manufacturer already exists",
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
          description: "Manufacturer not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    delete: {
      operationId: "deleteManufacturer",
      summary: "Delete a manufacturer (Admin-only)",
      description: "Delete a manufacturer. Cannot delete if products are using it. Requires admin or superadmin role.",
      tags: ["Manufacturers"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Manufacturer ID",
        },
      ],
      responses: {
        204: {
          description: "Manufacturer deleted successfully",
        },
        400: {
          description: "Cannot delete manufacturer (products are using it)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                message: "Cannot delete manufacturer: 5 product(s) are using this manufacturer. Please update or delete those products first.",
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
          description: "Manufacturer not found",
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

