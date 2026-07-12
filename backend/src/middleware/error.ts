import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

// 404 for unmatched routes.
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler — every error funnels through here into a consistent shape.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details ?? null });
  }

  // Prisma unique-constraint (e.g. duplicate registration/license/email)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found', details: null });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
    return res.status(409).json({ error: `A record with this ${target} already exists`, details: { target } });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Internal server error',
    details: env.NODE_ENV === 'development' && err instanceof Error ? err.message : null,
  });
};
