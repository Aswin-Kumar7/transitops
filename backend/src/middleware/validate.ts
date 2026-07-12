import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validate req.body / req.query / req.params against a Zod schema.
 * On failure, responds 400 with a field-level error map — so the UI can show
 * "Invalid email", "Cargo weight must be positive", etc.
 *
 *   router.post('/', validate(createVehicleSchema), controller.create)
 */
export const validate =
  (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      if (parsed.body) req.body = parsed.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          // drop the leading "body"/"query"/"params" segment for cleaner keys
          const key = issue.path.slice(1).join('.') || issue.path.join('.');
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        throw ApiError.badRequest('Validation failed', fieldErrors);
      }
      throw err;
    }
  };
