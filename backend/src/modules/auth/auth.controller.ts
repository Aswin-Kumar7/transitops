import { Request, Response } from 'express';
import { authService } from './auth.service';
import { PERMISSIONS } from '../../config/permissions';
import { ApiError } from '../../utils/ApiError';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json({ ...result, permissions: PERMISSIONS[result.user.role] });
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.me(req.user.sub);
    res.json({ user, permissions: PERMISSIONS[user.role] });
  },
};
