import { Request, Response } from 'express';
import { settingsService } from './settings.service';

export const settingsController = {
  async get(_req: Request, res: Response) {
    res.json(await settingsService.get());
  },
  async update(req: Request, res: Response) {
    res.json(await settingsService.update(req.body));
  },
};
