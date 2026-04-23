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

  return {
    ...payload,
    sub: `google_${payload.sub}`,
    email: typeof payload.email === "string" ? payload.email : undefined,
    "cognito:groups": [],
  };
}

async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  try {
    const { cognitoVerifier } = await import("../config/cognito.js");
    const payload = await cognitoVerifier.verify(token);

    return {
      ...payload,
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      "cognito:groups": Array.isArray(payload["cognito:groups"])
        ? payload["cognito:groups"].filter((group): group is string => typeof group === "string")
        : [],
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
