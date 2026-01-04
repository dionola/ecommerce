import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import productRoutes from "../routes/productRoutes";
import devAuthRoutes from "../routes/devAuthRoutes";
import { errorHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { swaggerSpec } from "../config/swagger";

const app = express();
const port = "3000";

// HTTP request logging middleware
app.use(morgan("combined"));

// Parse JSON bodies
app.use(express.json());

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/products", productRoutes);

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