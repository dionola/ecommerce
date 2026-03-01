import { Router } from "express";
import userController from "../controllers/userController";
import { validateRequestBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { CreateUserDto } from "../dtos/userDto";

const router = Router();

/**
 * Create a new admin or superadmin user
 * 
 * Requires admin or superadmin role.
 * Admins can only create admin users.
 * Superadmins can create both admin and superadmin users.
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(CreateUserDto),
  userController.createUser
);

export default router;

