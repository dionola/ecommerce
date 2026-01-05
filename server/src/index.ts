import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import productRoutes from "../routes/productRoutes";
import paymentRoutes from "../routes/paymentRoutes";
import cartRoutes from "../routes/cartRoutes";
import devAuthRoutes from "../routes/devAuthRoutes";
import { errorHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { swaggerSpec } from "../config/swagger";

const app = express();
const port = "3000";

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// HTTP request logging middleware
app.use(morgan("combined"));

// Parse JSON bodies
app.use(express.json());

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/products", productRoutes);
app.use("/payments", paymentRoutes);
app.use("/carts", cartRoutes);

// Development-only routes (returns 404 in production)
if (process.env.NODE_ENV !== "production") {
  app.use("/dev/auth", devAuthRoutes);
  logger.info("Development auth endpoints enabled at /dev/auth");
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Only start the server if not in test mode
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    logger.info(`Example app listening on port ${port}`);
  });
}

export { app };