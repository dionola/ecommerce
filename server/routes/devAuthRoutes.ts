import { Router } from "express";
import devAuthController from "../controllers/devAuthController";

const router = Router();

// List available users
router.get("/users", devAuthController.listDevUsers);

// Get token for a specific user type
router.get("/token/:userType", devAuthController.getDevToken);

export default router;

