import { Router } from "express";
import userController from "../controllers/userController.js";
import { validateRequestBody } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { CreateUserDto } from "../dtos/userDto.js";

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

