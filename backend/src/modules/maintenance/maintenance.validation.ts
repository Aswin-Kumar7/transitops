import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  body: z.object({
    vehicleId: z.string().trim().min(1, 'Vehicle is required'),
    serviceType: z.string().trim().min(1, 'Service type is required'),
    cost: z.coerce.number().nonnegative('Cost cannot be negative'),
    serviceDate: z.coerce.date({ errorMap: () => ({ message: 'Enter a valid service date' }) }),
    notes: z.string().trim().optional(),
  }),
});

export const closeMaintenanceSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>['body'];
