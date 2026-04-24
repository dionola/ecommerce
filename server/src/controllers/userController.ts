import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { createAdminUser, listUsers, updateExistingUserRole } from "../services/users/userManagementService.js";
import { CreateUserDtoType, UpdateUserRoleDtoType, UserIdParamDtoType } from "../dtos/userDto.js";
import { ValidationError } from "../errors/ValidationError.js";
import { logger } from "../utils/logger.js";

/**
 * Create a new admin or superadmin user
 * 
 * Admins can only create admin users.
 * Superadmins can create both admin and superadmin users.
 * 
 * Email verification is skipped for admin-created users.
 */
async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const body = res.locals.body as CreateUserDtoType;

  try {
    const creatorGroups = req.user["cognito:groups"] || [];
    const creatorRole = creatorGroups.includes("superadmin")
      ? "superadmin"
      : creatorGroups.includes("admin")
      ? "admin"
      : undefined;

    const result = await createAdminUser(
      body.email,
      body.password,
      body.fullName,
      body.role,
      creatorRole
    );

    res.status(201).json(result);
  } catch (error: any) {
    logger.error("Error in createUser controller:", error);

    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    // Handle Cognito errors
    if (error.name === "UsernameExistsException" || error.name === "AliasExistsException") {
      res.status(409).json({ message: `User with email ${body.email} already exists` });
      return;
    }

    res.status(500).json({ message: "Failed to create user", error: error.message });
  }
}

async function getUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const users = await listUsers();
  res.json(users);
}

async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const params = res.locals.params as UserIdParamDtoType;
  const body = res.locals.body as UpdateUserRoleDtoType;

  try {
    const creatorGroups = req.user["cognito:groups"] || [];
    const creatorRole = creatorGroups.includes("superadmin")
      ? "superadmin"
      : creatorGroups.includes("admin")
      ? "admin"
      : undefined;

    const result = await updateExistingUserRole(params.id, body.role, creatorRole);
    res.json(result);
  } catch (error: any) {
    logger.error("Error in updateUserRole controller:", error);

    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: "Failed to update user role", error: error.message });
  }
}

export default {
  createUser,
  getUsers,
  updateUserRole,
};

