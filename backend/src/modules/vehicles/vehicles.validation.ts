import { z } from 'zod';
import { VehicleType, VehicleStatus } from '@prisma/client';

export const listVehiclesQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    type: z.nativeEnum(VehicleType, { errorMap: () => ({ message: 'Select a valid type' }) }).optional(),
    status: z
      .nativeEnum(VehicleStatus, { errorMap: () => ({ message: 'Select a valid status' }) })
      .optional(),
    search: z.string().trim().optional(),
  }),
});

export const createVehicleSchema = z.object({
  body: z.object({
    registrationNo: z.string().trim().min(1, 'Registration number is required'),
    name: z.string().trim().min(1, 'Name/model is required'),
    type: z.nativeEnum(VehicleType, { errorMap: () => ({ message: 'Select a valid type' }) }),
    capacityKg: z.coerce.number().int().positive('Capacity must be greater than 0'),
    odometer: z.coerce.number().int().nonnegative('Odometer cannot be negative').default(0),
    acquisitionCost: z.coerce.number().nonnegative('Cost cannot be negative'),
  }),
});

export const updateVehicleSchema = z.object({
  body: z.object({
    registrationNo: z.string().trim().min(1, 'Registration number is required'),
    name: z.string().trim().min(1, 'Name/model is required'),
    type: z.nativeEnum(VehicleType, { errorMap: () => ({ message: 'Select a valid type' }) }),
    capacityKg: z.coerce.number().int().positive('Capacity must be greater than 0'),
    odometer: z.coerce.number().int().nonnegative('Odometer cannot be negative'),
    acquisitionCost: z.coerce.number().nonnegative('Cost cannot be negative'),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateVehicleStatusSchema = z.object({
  body: z.object({
    status: z.enum(['AVAILABLE', 'RETIRED'], {
      errorMap: () => ({ message: 'Status must be AVAILABLE or RETIRED' }),
    }),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>['query'];
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>['body'];
export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>['body'];
