import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { validateEnv } from "./config/env";
import { pool } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter, sensitiveLimiter } from "./middleware/rateLimit";
import productRoutes from "./routes/productRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import promoRoutes from "./routes/promoRoutes";
import manufacturerRoutes from "./routes/manufacturerRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import userRoutes from "./routes/userRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import testAuthRoutes from "./routes/testAuthRoutes";
import healthRoutes from "./routes/healthRoutes";
import { logger } from "./utils/logger";
import { swaggerSpec } from "./config/swagger";

validateEnv();

const app = express();
const port = process.env.PORT || "3001";

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(morgan("combined"));
app.use(express.json());

app.use(generalLimiter);

app.use("/health", healthRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/products", productRoutes);
app.use("/payments", sensitiveLimiter, paymentRoutes);
app.use("/carts", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/promos", promoRoutes);
app.use("/manufacturers", manufacturerRoutes);
app.use("/wishlists", wishlistRoutes);
app.use("/users", userRoutes);
app.use("/banner", bannerRoutes);

if (process.env.NODE_ENV !== "production") {
  app.use("/", testAuthRoutes);
  logger.info("Test auth endpoints enabled at /test-token");
}

app.use(errorHandler);

let server: ReturnType<express.Express["listen"]> | null = null;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    if (server) {
      server.close(() => {
        pool.end().then(() => {
          logger.info("Database pool closed");
          process.exit(0);
        }).catch((err) => {
          logger.error("Error closing pool", err);
          process.exit(1);
        });
      });
    } else {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export { app };