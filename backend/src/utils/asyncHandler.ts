import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any thrown/rejected error is forwarded to the
 * Express error middleware instead of crashing the process.
 *
 *   router.get('/', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
