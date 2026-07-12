import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { Module, canRead, canWrite } from '../config/permissions';
import { ApiError } from '../utils/ApiError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Guard a route group by module. Read (GET) needs 'view' or 'full';
 * any write method needs 'full'. Use after `authenticate`.
 *
 *   router.use(authenticate, requireModule('fleet'))
 */
export const requireModule =
  (module: Module) => (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role as Role | undefined;
    if (!role) throw ApiError.unauthorized();

    const isRead = SAFE_METHODS.has(req.method);
    const allowed = isRead ? canRead(role, module) : canWrite(role, module);

    if (!allowed) {
      throw ApiError.forbidden(`Your role (${role}) cannot ${isRead ? 'view' : 'modify'} ${module}`);
    }
    next();
  };

/** Restrict a route to an explicit set of roles. */
export const requireRole =
  (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role as Role | undefined;
    if (!role) throw ApiError.unauthorized();
    if (!roles.includes(role)) throw ApiError.forbidden();
    next();
  };
