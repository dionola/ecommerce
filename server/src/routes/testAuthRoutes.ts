import { Router } from "express";
import testAuthController from "../controllers/testAuthController";

const router = Router();

/**
 * Development-only route for getting test tokens for Swagger UI
 * This route is only available when NODE_ENV is not "production"
 */
if (process.env.NODE_ENV !== "production") {
  router.post("/test-token", testAuthController.getTestToken);
}

export default router;

