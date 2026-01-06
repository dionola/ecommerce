import { RequestHandler } from 'express';
import { ZodType, z } from 'zod';

const validate = (
  schema: ZodType,
  source: 'body' | 'params' | 'query'
): RequestHandler => {
  return async (req, res, next) => {
    try {
      if (!schema) {
        throw new Error(`Schema is undefined for ${source} validation`);
      }
      const validatedData = await schema.parseAsync(req[source]);
      res.locals[source] = validatedData;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: `Invalid ${source} schema`,
          errors: err.issues,
        });
      } else {
        next(err);
      }
    }
  };
};

const validateRequestBody = (schema: ZodType): RequestHandler => {
  return validate(schema, 'body');
};

const validateRequestParams = (schema: ZodType): RequestHandler => {
  return validate(schema, 'params');
};

const validateRequestQuery = (schema: ZodType): RequestHandler => {
  return validate(schema, 'query');
};

export { validateRequestBody, validateRequestParams, validateRequestQuery };

