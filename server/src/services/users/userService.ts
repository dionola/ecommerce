import { query } from "../../models/databaseModel.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { logger } from "../../utils/logger.js";

/**
 * Gets user ID from database using Cognito sub (subject claim from JWT)
 * 
 * @param cognitoSub - The Cognito user sub (UUID from JWT token)
 * @returns The user's database ID
 * @throws NotFoundError if user doesn't exist
 */
export async function getUserIdByCognitoSub(cognitoSub: string): Promise<number> {
  const getUserQuery = `
    SELECT id FROM users WHERE cognito_sub = $1
  `;
  
  const result = await query(getUserQuery, [cognitoSub]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`User with cognito_sub ${cognitoSub} not found`);
  }
  
  return result.rows[0].id;
}

/**
 * Gets or creates a user in the database
 * 
 * If the user exists, returns their ID. If not, creates a new user record
 * and returns the new ID. This is useful for automatically creating DB records
 * when users first authenticate.
 * 
 * @param cognitoSub - The Cognito user sub (UUID from JWT token)
 * @param email - User's email address
 * @param fullName - User's full name (optional)
 * @returns The user's database ID
 */
export async function getOrCreateUser(
  cognitoSub: string,
  email: string,
  fullName?: string
): Promise<number> {
  // Try to get existing user
  const getUserQuery = `
    SELECT id FROM users WHERE cognito_sub = $1
  `;
  
  const existingUser = await query(getUserQuery, [cognitoSub]);
  
  if (existingUser.rows.length > 0) {
    const userId = existingUser.rows[0].id;
    
    // Update email and name if they've changed (in case user updated in Cognito)
    const updateQuery = `
      UPDATE users 
      SET email = $1, full_name = COALESCE($2, full_name)
      WHERE id = $3
    `;
    await query(updateQuery, [email, fullName || null, userId]);
    
    return userId;
  }
  
  // Create new user
  const createUserQuery = `
    INSERT INTO users (cognito_sub, email, full_name)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  
  const newUser = await query(createUserQuery, [cognitoSub, email, fullName || null]);
  
  if (newUser.rows.length === 0) {
    throw new Error("Failed to create user");
  }
  
  logger.info(`Created new user in database: ${email} (sub: ${cognitoSub})`);
  
  return newUser.rows[0].id;
}

