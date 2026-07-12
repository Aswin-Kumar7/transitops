import { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { tripsService } from './trips.service';

export const tripsController = {
  async list(_req: Request, res: Response) {
    res.json(await tripsService.list());
  },

  async options(_req: Request, res: Response) {
    res.json(await tripsService.options());
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await tripsService.create(req.body, req.user?.sub));
  },

  async dispatch(req: Request, res: Response) {
    res.json(await tripsService.dispatch(req.params.id, req.body));
  },

  async complete(req: Request, res: Response) {
    res.json(await tripsService.complete(req.params.id, req.body));
  },

  async cancel(req: Request, res: Response) {
    if (!req.body.cancelReason) throw ApiError.badRequest('Enter a cancellation reason');
    res.json(await tripsService.cancel(req.params.id, req.body));
  },
};
