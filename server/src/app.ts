import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { validateEnv } from "./config/env.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import manufacturerRoutes from "./routes/manufacturerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import testAuthRoutes from "./routes/testAuthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter, sensitiveLimiter } from "./middleware/rateLimit.js";
import { logger } from "./utils/logger.js";

validateEnv();

const app = express();

// The app runs behind a reverse proxy in production, so trust the first proxy
// to read the real client IP from X-Forwarded-For for rate limiting/logging.
app.set("trust proxy", 1);

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

export default app;
