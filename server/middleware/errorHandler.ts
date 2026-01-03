import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/ValidationError";
import { logger } from "../utils/logger";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error("Error:", error);

  // Handle validation errors with proper status code
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errors: error.validationErrors,
    });
  }

  // Handle other errors as internal server errors
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

