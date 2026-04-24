import type { NextFunction, Request, Response } from "express";

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  "cognito:groups"?: string[];
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function getBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function getDatabaseRole(sub: string, email?: string): Promise<"customer" | "admin" | "superadmin" | null> {
  try {
    const { query } = await import("../models/databaseModel.js");
    const result = await query(
      `
        SELECT role
        FROM users
        WHERE cognito_sub = $1 OR ($2 IS NOT NULL AND email = $2)
        ORDER BY id DESC
        LIMIT 1
      `,
      [sub, email ?? null]
    );

    const role = result.rows[0]?.role;
    return role === "customer" || role === "admin" || role === "superadmin" ? role : null;
  } catch {
    return null;
  }
}

async function verifyGoogleToken(token: string): Promise<AuthenticatedUser> {
  const audience =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID;

  if (!audience) {
    throw new Error("Google client ID is not configured");
  }

  const { OAuth2Client } = await import("google-auth-library");
  const client = new OAuth2Client(audience);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub) {
    throw new Error("Google token payload missing subject");
  }

  const email = typeof payload.email === "string" ? payload.email : undefined;
  const databaseRole = await getDatabaseRole(`google_${payload.sub}`, email);

  return {
    ...payload,
    sub: `google_${payload.sub}`,
    email,
    "cognito:groups": databaseRole && databaseRole !== "customer" ? [databaseRole] : [],
  };
}

async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  try {
    const { cognitoVerifier } = await import("../config/cognito.js");
    const payload = await cognitoVerifier.verify(token);
    const email = typeof payload.email === "string" ? payload.email : undefined;
    const databaseRole = await getDatabaseRole(payload.sub, email);
    const tokenGroups = Array.isArray(payload["cognito:groups"])
      ? payload["cognito:groups"].filter((group): group is string => typeof group === "string")
      : [];

    return {
      ...payload,
      sub: payload.sub,
      email,
      "cognito:groups": databaseRole && databaseRole !== "customer"
        ? [...new Set([...tokenGroups, databaseRole])]
        : tokenGroups,
    };
  } catch {
    return verifyGoogleToken(token);
  }
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    req.user = await verifyAccessToken(token);
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    next();
    return;
  }

  try {
    req.user = await verifyAccessToken(token);
  } catch {
    req.user = undefined;
  }

  next();
}
