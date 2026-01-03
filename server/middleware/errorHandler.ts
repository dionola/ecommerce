import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/ValidationError";
import { NotFoundError } from "../errors/NotFoundError";
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

  // Handle not found errors with proper status code
  if (error instanceof NotFoundError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  // Handle other errors as internal server errors
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

