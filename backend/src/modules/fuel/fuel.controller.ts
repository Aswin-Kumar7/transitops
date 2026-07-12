import { Request, Response } from 'express';
import { fuelService } from './fuel.service';

export const fuelController = {
  async listLogs(_req: Request, res: Response) {
    res.json(await fuelService.listLogs());
  },
  async listExpenses(_req: Request, res: Response) {
    res.json(await fuelService.listExpenses());
  },
  async logFuel(req: Request, res: Response) {
    res.status(201).json(await fuelService.logFuel(req.body));
  },
  async addExpense(req: Request, res: Response) {
    res.status(201).json(await fuelService.addExpense(req.body));
  },
  async summary(_req: Request, res: Response) {
    res.json(await fuelService.summary());
  },
};
