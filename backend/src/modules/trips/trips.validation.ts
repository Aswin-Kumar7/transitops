import { z } from 'zod';

const id = z.string().cuid('Invalid id');

export const createTripSchema = z.object({
  body: z.object({
    source: z.string().trim().min(1, 'Source is required').max(120, 'Source is too long'),
    destination: z.string().trim().min(1, 'Destination is required').max(120, 'Destination is too long'),
    cargoWeightKg: z.coerce.number().int().positive('Cargo weight must be greater than 0'),
    plannedDistanceKm: z.coerce.number().int().positive('Distance must be greater than 0'),
    vehicleId: id.optional(),
    driverId: id.optional(),
  }),
});

export const dispatchTripSchema = z.object({
  params: z.object({ id }),
  body: z.object({ vehicleId: id.optional(), driverId: id.optional() }),
});

export const completeTripSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    endOdometer: z.coerce.number().int().nonnegative('End odometer cannot be negative'),
    revenue: z.coerce.number().nonnegative('Revenue cannot be negative').optional(),
  }),
});

export const cancelTripSchema = z.object({
  params: z.object({ id }),
  body: z.object({ cancelReason: z.string().trim().min(3, 'Enter a cancellation reason').max(500, 'Cancellation reason is too long') }),
});

export type CreateTripInput = z.infer<typeof createTripSchema>['body'];
export type DispatchTripInput = z.infer<typeof dispatchTripSchema>['body'];
export type CompleteTripInput = z.infer<typeof completeTripSchema>['body'];
export type CancelTripInput = z.infer<typeof cancelTripSchema>['body'];
