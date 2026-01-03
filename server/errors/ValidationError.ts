export class ValidationError extends Error {
  public readonly statusCode: number = 422;
  public readonly validationErrors: any;

  constructor(message: string, validationErrors?: any) {
    super(message);
    this.name = "ValidationError";
    this.validationErrors = validationErrors;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

