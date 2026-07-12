import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  async overview(_req: Request, res: Response) {
    res.json(await analyticsService.overview());
  },
};
