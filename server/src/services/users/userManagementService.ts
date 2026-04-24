import {
  AdminCreateUserCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  ListUsersCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, cognitoConfig } from "../../config/cognito.js";
import { getOrCreateUser } from "./userService.js";
import { CreateUserResponseDtoType, UserListItemDtoType } from "../../dtos/userDto.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { logger } from "../../utils/logger.js";
import { query } from "../../models/databaseModel.js";

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
    await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);

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

async function getCognitoUsernameByEmail(email: string): Promise<string | null> {
  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: cognitoConfig.userPoolId,
      Filter: `email = "${email}"`,
      Limit: 1,
    })
  );

  return response.Users?.[0]?.Username ?? null;
}

async function getUserRoleByUsername(username: string): Promise<"customer" | "admin" | "superadmin"> {
  const response = await cognitoClient.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: cognitoConfig.userPoolId,
      Username: username,
    })
  );

  const groupNames = (response.Groups ?? []).map((group) => group.GroupName).filter(Boolean);

  if (groupNames.includes("superadmin")) {
    return "superadmin";
  }

  if (groupNames.includes("admin")) {
    return "admin";
  }

  return "customer";
}

export async function listUsers(): Promise<UserListItemDtoType[]> {
  const result = await query(
    `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.cognito_sub,
        u.role,
        u.created_at,
        COUNT(DISTINCT o.id)::int AS order_count,
        COALESCE(SUM(oi.quantity), 0)::int AS total_items_ordered
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY u.id, u.email, u.full_name, u.cognito_sub, u.role, u.created_at
      ORDER BY u.created_at DESC, u.id DESC
    `
  );

  return Promise.all(
    result.rows.map(async (row) => {
      const username = await getCognitoUsernameByEmail(row.email);
      const cognitoRole = username ? await getUserRoleByUsername(username) : "customer";
      const role = row.role ?? cognitoRole;

      return {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        cognitoSub: row.cognito_sub,
        role,
        orderCount: row.order_count,
        totalItemsOrdered: row.total_items_ordered,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      };
    })
  );
}

export async function updateExistingUserRole(
  userId: number,
  role: "admin" | "superadmin",
  creatorRole: string | undefined
): Promise<UserListItemDtoType> {
  validateRolePermission(creatorRole, role);

  const result = await query(
    `
      SELECT id, email, full_name, cognito_sub, role, created_at
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new ValidationError(`User with id ${userId} not found`);
  }

  const dbUser = result.rows[0];
  await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);

  const username = await getCognitoUsernameByEmail(dbUser.email);

  if (username) {
    // Keep roles mutually exclusive so the UI stays predictable.
    for (const groupName of ["admin", "superadmin"]) {
      if (groupName !== role) {
        try {
          await cognitoClient.send(
            new AdminRemoveUserFromGroupCommand({
              UserPoolId: cognitoConfig.userPoolId,
              Username: username,
              GroupName: groupName,
            })
          );
        } catch {
          // Ignore if the user wasn't in the group.
        }
      }
    }

    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: cognitoConfig.userPoolId,
        Username: username,
        GroupName: role,
      })
    );
  }

  logger.info(`Updated user role: ${dbUser.email} -> ${role} by ${creatorRole}`);

  const [updatedUser] = await listUsers().then((users) => users.filter((user) => user.id === userId));

  if (!updatedUser) {
    throw new ValidationError(`Failed to reload user ${dbUser.email} after role update`);
  }

  return updatedUser;
}
