import { Router } from "express";
import userController from "../controllers/userController.js";
import { validateRequestBody, validateRequestParams } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { CreateUserDto, UpdateUserRoleDto, UserIdParamDto } from "../dtos/userDto.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  userController.getUsers
);

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

router.patch(
  "/:id/role",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(UserIdParamDto),
  validateRequestBody(UpdateUserRoleDto),
  userController.updateUserRole
);

export default router;
