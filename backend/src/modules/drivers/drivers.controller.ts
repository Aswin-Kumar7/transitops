import { Request, Response } from 'express';
import { driversService } from './drivers.service';

export const driversController = {
  async list(_req: Request, res: Response) {
    res.json(await driversService.list());
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await driversService.create(req.body));
  },

  async update(req: Request, res: Response) {
    res.json(await driversService.update(req.params.id, req.body));
  },

  async updateStatus(req: Request, res: Response) {
    res.json(await driversService.updateStatus(req.params.id, req.body.status));
  },
};
