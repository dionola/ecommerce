import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, cognitoConfig } from "../../config/cognito.js";
import { getOrCreateUser } from "./userService.js";
import { CreateUserDtoType, CreateUserResponseDtoType } from "../../dtos/userDto.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { logger } from "../../utils/logger.js";

/**
 * Validates that the creator has permission to create a user with the requested role
 * 
 * @param creatorRole - Role of the user creating the new user (from JWT token)
 * @param requestedRole - Role being requested for the new user
 * @throws ValidationError if permission denied
 */
function validateRolePermission(creatorRole: string | undefined, requestedRole: "admin" | "superadmin"): void {
  if (!creatorRole) {
    throw new ValidationError("Creator role not found in token");
  }

  // Admin can only create admin users
  if (creatorRole === "admin" && requestedRole === "superadmin") {
    throw new ValidationError("Admins can only create admin users. Superadmin role required to create superadmin users.");
  }

  // Superadmin can create both admin and superadmin
  if (creatorRole === "superadmin") {
    return; // Allowed
  }

  // Admin creating admin is allowed
  if (creatorRole === "admin" && requestedRole === "admin") {
    return; // Allowed
  }

  // Default: deny
  throw new ValidationError(`Insufficient permissions to create ${requestedRole} user`);
}

/**
 * Creates a new admin or superadmin user in Cognito and database
 * 
 * @param email - User's email address
 * @param password - User's password
 * @param fullName - User's full name (optional)
 * @param role - User's role ('admin' or 'superadmin')
 * @param creatorRole - Role of the user creating this user (from JWT token)
 * @returns Created user information
 */
export async function createAdminUser(
  email: string,
  password: string,
  fullName: string | undefined,
  role: "admin" | "superadmin",
  creatorRole: string | undefined
): Promise<CreateUserResponseDtoType> {
  // Validate permissions
  validateRolePermission(creatorRole, role);

  try {
    // Create user in Cognito
    const createUserResponse = await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: cognitoConfig.userPoolId,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" }, // Skip email verification
          ...(fullName ? [{ Name: "name", Value: fullName }] : []),
        ],
        MessageAction: "SUPPRESS", // Don't send welcome email
        DesiredDeliveryMediums: [],
      })
    );

    const cognitoSub = createUserResponse.User?.Attributes?.find((attr) => attr.Name === "sub")?.Value;

    if (!cognitoSub) {
      throw new Error(`Failed to get sub for user ${email}`);
    }

    // Set permanent password
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: cognitoConfig.userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );

    // Add user to appropriate Cognito group
    if (role === "admin" || role === "superadmin") {
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: cognitoConfig.userPoolId,
          Username: email,
          GroupName: role,
        })
      );
    }

    // Create or get user in database
    const userId = await getOrCreateUser(cognitoSub, email, fullName);

    logger.info(`Admin user created: ${email} (role: ${role}) by ${creatorRole}`);

    return {
      id: userId,
      email,
      fullName: fullName || null,
      role,
      cognitoSub,
    };
  } catch (error: any) {
    // Handle user already exists
    if (error.name === "UsernameExistsException" || error.name === "AliasExistsException") {
      throw new ValidationError(`User with email ${email} already exists`);
    }

    logger.error("Error creating admin user:", error);
    throw error;
  }
}

