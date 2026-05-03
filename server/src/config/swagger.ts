import swaggerJsdoc from "swagger-jsdoc";
import { swaggerPaths } from "./index.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce Store API",
      version: "1.0.0",
      description: `API documentation for the E-Commerce Store

## Testing Authenticated Endpoints

To test create, update, and delete operations in Swagger UI:

1. **Get a test token**: Use the \`POST /test-token\` endpoint (available in development mode)
   - Use a valid development account from your Cognito user pool
   - Copy the \`token\` from the response

2. **Authorize in Swagger UI**:
   - Click the "Authorize" button at the top right
   - Paste the token into the "Value" field
   - Click "Authorize" then "Close"

3. **Test endpoints**: Now you can test all authenticated endpoints (create, update, delete)

**Note**: The test token endpoint is only available in development mode.`,
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${process.env.PORT || "3001"}`,
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
        Promo: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Promo ID",
            },
            code: {
              type: "string",
              maxLength: 50,
              description: "Promo code",
            },
            discount_type: {
              type: "string",
              enum: ["percentage", "fixed"],
              description: "Type of discount",
            },
            discount_value: {
              type: "number",
              minimum: 0,
              description: "Discount value",
            },
            active_until: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Expiration date (null means no expiration)",
            },
          },
          required: ["id", "code", "discount_type", "discount_value"],
        },
        CreatePromo: {
          type: "object",
          properties: {
            code: {
              type: "string",
              maxLength: 50,
              description: "Promo code",
            },
            discount_type: {
              type: "string",
              enum: ["percentage", "fixed"],
              description: "Type of discount",
            },
            discount_value: {
              type: "number",
              minimum: 0,
              description: "Discount value",
            },
            active_until: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Expiration date (null means no expiration)",
            },
          },
          required: ["code", "discount_type", "discount_value"],
        },
        UpdatePromo: {
          type: "object",
          properties: {
            code: {
              type: "string",
              maxLength: 50,
              description: "Promo code",
            },
            discount_type: {
              type: "string",
              enum: ["percentage", "fixed"],
              description: "Type of discount",
            },
            discount_value: {
              type: "number",
              minimum: 0,
              description: "Discount value",
            },
            active_until: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Expiration date (null means no expiration)",
            },
          },
          description: "At least one field must be provided",
        },
        WishlistItem: {
          type: "object",
          properties: {
            product: {
              $ref: "#/components/schemas/Product",
            },
          },
          required: ["product"],
        },
        Wishlist: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Wishlist ID",
            },
            user_id: {
              type: "integer",
              description: "User ID",
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/WishlistItem",
              },
              default: [],
              description: "Wishlist items",
            },
          },
          required: ["id", "user_id", "items"],
        },
        AddWishlistItem: {
          type: "object",
          properties: {
            product_id: {
              type: "integer",
              minimum: 1,
              description: "Product ID to add",
            },
          },
          required: ["product_id"],
        },
        RemoveWishlistItem: {
          type: "object",
          properties: {
            product_id: {
              type: "integer",
              minimum: 1,
              description: "Product ID to remove",
            },
          },
          required: ["product_id"],
        },
        CartItem: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Cart item ID",
            },
            product: {
              $ref: "#/components/schemas/Product",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              description: "Item quantity",
            },
          },
          required: ["id", "product", "quantity"],
        },
        Cart: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Cart ID",
            },
            user_id: {
              type: "integer",
              description: "User ID",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/CartItem",
              },
              default: [],
              description: "Cart items",
            },
            subtotal: {
              type: "number",
              minimum: 0,
              description: "Subtotal before discounts",
            },
            total: {
              type: "number",
              minimum: 0,
              description: "Total amount (same as subtotal for cart, will include promo discount in order)",
            },
          },
          required: ["id", "user_id", "updated_at", "items", "subtotal", "total"],
        },
        AddCartItem: {
          type: "object",
          properties: {
            product_id: {
              type: "integer",
              minimum: 1,
              description: "Product ID to add",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              default: 1,
              description: "Quantity to add",
            },
          },
          required: ["product_id"],
        },
        UpdateCartItem: {
          type: "object",
          properties: {
            quantity: {
              type: "integer",
              minimum: 1,
              description: "New quantity",
            },
          },
          required: ["quantity"],
        },
        OrderItem: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Order item ID",
            },
            product: {
              $ref: "#/components/schemas/Product",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              description: "Item quantity",
            },
            price_at_purchase: {
              type: "number",
              minimum: 0,
              description: "Product price at time of purchase (snapshot)",
            },
          },
          required: ["id", "product", "quantity", "price_at_purchase"],
        },
        Order: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Order ID",
            },
            user_id: {
              type: "integer",
              description: "User ID",
            },
            total_amount: {
              type: "number",
              minimum: 0,
              description: "Total order amount (after discounts)",
            },
            status: {
              type: "string",
              description: "Order status (e.g., pending, completed, cancelled)",
            },
            promo_id: {
              type: "integer",
              nullable: true,
              description: "Applied promo code ID",
            },
            payment_intent_id: {
              type: "string",
              nullable: true,
              description: "Payment intent ID",
            },
            shipping_address: {
              type: "object",
              nullable: true,
              description: "Shipping address (JSON object)",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Order creation timestamp",
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/OrderItem",
              },
              default: [],
              description: "Order items",
            },
          },
          required: ["id", "user_id", "total_amount", "status", "created_at", "items"],
        },
        CreateOrder: {
          type: "object",
          properties: {
            shipping_address: {
              type: "object",
              description: "Shipping address (JSON object with street, city, state, zip, country, etc.)",
            },
            promo_id: {
              type: "integer",
              nullable: true,
              description: "Optional promo code ID to apply",
            },
          },
          required: ["shipping_address"],
        },
        UpdateOrder: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Order status",
            },
            payment_intent_id: {
              type: "string",
              nullable: true,
              description: "Payment intent ID",
            },
          },
          description: "At least one field must be provided",
        },
        CreateUser: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "User's password (minimum 8 characters)",
            },
            fullName: {
              type: "string",
              nullable: true,
              description: "User's full name (optional)",
            },
            role: {
              type: "string",
              enum: ["admin", "superadmin"],
              description: "User's role. Admins can only create admin users. Superadmins can create both.",
            },
          },
          required: ["email", "password", "role"],
        },
        CreateUserResponse: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Database user ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            fullName: {
              type: "string",
              nullable: true,
              description: "User's full name",
            },
            role: {
              type: "string",
              enum: ["admin", "superadmin"],
              description: "User's role",
            },
            cognitoSub: {
              type: "string",
              description: "Cognito user sub (UUID)",
            },
          },
          required: ["id", "email", "role", "cognitoSub"],
        },
        Manufacturer: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Manufacturer ID",
            },
            name: {
              type: "string",
              description: "Manufacturer name",
            },
          },
          required: ["id", "name"],
        },
        CreateManufacturer: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Manufacturer name (must be unique)",
            },
          },
          required: ["name"],
        },
        UpdateManufacturer: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Manufacturer name (must be unique)",
            },
          },
          description: "At least one field must be provided",
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
