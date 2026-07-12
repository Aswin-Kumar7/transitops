import { Request, Response } from 'express';
import { maintenanceService } from './maintenance.service';

export const maintenanceController = {
  async list(_req: Request, res: Response) {
    const records = await maintenanceService.list();
    res.json(records);
  },

  async logService(req: Request, res: Response) {
    const record = await maintenanceService.logService(req.body);
    res.status(201).json(record);
  },

  async closeService(req: Request, res: Response) {
    const record = await maintenanceService.closeService(req.params.id);
    res.json(record);
  },
};
