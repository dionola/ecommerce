import swaggerJsdoc from "swagger-jsdoc";
import { swaggerPaths } from "./swaggerPaths/index";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce Store API",
      version: "1.0.0",
      description: "API documentation for the E-Commerce Store",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    paths: swaggerPaths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "AWS Cognito JWT token. Format: Bearer {token}",
        },
      },
      schemas: {
        ProductImage: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Image ID",
            },
            url: {
              type: "string",
              description: "Image URL",
            },
            is_main: {
              type: "boolean",
              description: "Whether this is the main product image",
            },
          },
          required: ["id", "url", "is_main"],
        },
        Product: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Product ID",
            },
            name: {
              type: "string",
              maxLength: 255,
              description: "Product name",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Product description",
            },
            base_price: {
              type: "number",
              minimum: 0,
              description: "Product base price",
            },
            country_of_origin: {
              type: "string",
              maxLength: 100,
              nullable: true,
              description: "Country of origin",
            },
            stock_quantity: {
              type: "integer",
              minimum: 0,
              description: "Stock quantity",
            },
            manufacturer_id: {
              type: "integer",
              nullable: true,
              description: "Manufacturer ID",
            },
            images: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ProductImage",
              },
              description: "Product images",
            },
          },
          required: ["id", "name", "base_price", "stock_quantity", "images"],
        },
        CreateProduct: {
          type: "object",
          properties: {
            name: {
              type: "string",
              maxLength: 255,
              description: "Product name",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Product description",
            },
            base_price: {
              type: "number",
              minimum: 0,
              description: "Product base price",
            },
            country_of_origin: {
              type: "string",
              maxLength: 100,
              nullable: true,
              description: "Country of origin",
            },
            stock_quantity: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Stock quantity",
            },
            manufacturer_id: {
              type: "integer",
              nullable: true,
              description: "Manufacturer ID",
            },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    description: "Image URL",
                  },
                  is_main: {
                    type: "boolean",
                    default: false,
                    description: "Whether this is the main product image",
                  },
                },
                required: ["url"],
              },
              default: [],
              description: "Product images",
            },
          },
          required: ["name", "base_price"],
        },
        UpdateProduct: {
          type: "object",
          properties: {
            name: {
              type: "string",
              maxLength: 255,
              description: "Product name",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Product description",
            },
            base_price: {
              type: "number",
              minimum: 0,
              description: "Product base price",
            },
            country_of_origin: {
              type: "string",
              maxLength: 100,
              nullable: true,
              description: "Country of origin",
            },
            stock_quantity: {
              type: "integer",
              minimum: 0,
              description: "Stock quantity",
            },
            manufacturer_id: {
              type: "integer",
              nullable: true,
              description: "Manufacturer ID",
            },
          },
          description: "At least one field must be provided",
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
              },
              description: "Validation errors (if applicable)",
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

