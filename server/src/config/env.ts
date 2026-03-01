/**
 * Validates required environment variables at startup.
 * Exits process with clear message if any are missing.
 */
const required = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
] as const;

const requiredForProduction = [
  "FRONTEND_URL",
  "STRIPE_SECRET_KEY",
  "AWS_COGNITO_USER_POOL_ID",
  "AWS_COGNITO_CLIENT_ID",
  "AWS_REGION",
] as const;

export function validateEnv(): void {
  if (process.env.NODE_ENV === "test") return;

  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error("Missing required environment variables:", missing.join(", "));
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    const missingProd = requiredForProduction.filter((key) => !process.env[key]?.trim());
    if (missingProd.length > 0) {
      console.error("Missing required production env vars:", missingProd.join(", "));
      process.exit(1);
    }
  }
}
