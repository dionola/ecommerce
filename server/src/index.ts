import app from "./app.js";
import { pool } from "./config/database.js";
import { logger } from "./utils/logger.js";
const port = process.env.PORT || "3001";

let server: ReturnType<typeof app.listen> | null = null;

if (process.env.NODE_ENV !== "test" && process.env.VERCEL !== "1") {
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
