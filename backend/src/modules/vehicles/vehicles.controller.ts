import { Request, Response } from 'express';
import { vehiclesService } from './vehicles.service';
import { ListVehiclesQuery } from './vehicles.validation';

export const vehiclesController = {
  async list(req: Request, res: Response) {
    const vehicles = await vehiclesService.list(req.query as unknown as ListVehiclesQuery);
    res.json(vehicles);
  },

  async create(req: Request, res: Response) {
    const vehicle = await vehiclesService.create(req.body);
    res.status(201).json(vehicle);
  },

  async update(req: Request, res: Response) {
    const vehicle = await vehiclesService.update(req.params.id, req.body);
    res.json(vehicle);
  },

  async updateStatus(req: Request, res: Response) {
    const vehicle = await vehiclesService.updateStatus(req.params.id, req.body);
    res.json(vehicle);
  },
};
