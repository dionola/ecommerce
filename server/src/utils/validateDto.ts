import { z } from "zod";
import { ValidationError } from "../errors/ValidationError.js";
import { logger } from "./logger.js";

/**
 * Validates data against a Zod schema and throws ValidationError if invalid
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param errorMessage - Optional custom error message
 * @returns Validated data with proper TypeScript types
 * @throws ValidationError if validation fails
 */
export function validateDto<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  errorMessage: string = "Data validation failed"
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    logger.error("DTO validation error:", result.error);
    throw new ValidationError(errorMessage, result.error.issues);
  }

  return result.data;
}

