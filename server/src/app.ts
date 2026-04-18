import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { validateEnv } from "./config/env";
import bannerRoutes from "./routes/bannerRoutes";
import cartRoutes from "./routes/cartRoutes";
import healthRoutes from "./routes/healthRoutes";
import manufacturerRoutes from "./routes/manufacturerRoutes";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import productRoutes from "./routes/productRoutes";
import promoRoutes from "./routes/promoRoutes";
import testAuthRoutes from "./routes/testAuthRoutes";
import userRoutes from "./routes/userRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter, sensitiveLimiter } from "./middleware/rateLimit";
import { logger } from "./utils/logger";

validateEnv();

const app = express();

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
