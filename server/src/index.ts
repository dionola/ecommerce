import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import productRoutes from "../routes/productRoutes";
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

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});