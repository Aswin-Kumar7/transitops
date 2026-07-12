import { DriverStatus, LicenseCategory } from '@prisma/client';
import { z } from 'zod';

const driverFields = {
  name: z.string().trim().min(2, 'Driver name must be at least 2 characters'),
  licenseNo: z.string().trim().min(3, 'License number is required').max(40, 'License number is too long'),
  licenseCategory: z.nativeEnum(LicenseCategory, { errorMap: () => ({ message: 'Select a valid license category' }) }),
  licenseExpiry: z.coerce.date({ invalid_type_error: 'Enter a valid license expiry date' }),
  contact: z.string().trim().min(5, 'Enter a valid contact number').max(30, 'Contact number is too long'),
  tripCompletionRate: z.coerce.number().min(0, 'Completion rate cannot be negative').max(100, 'Completion rate cannot exceed 100'),
};

export const createDriverSchema = z.object({ body: z.object(driverFields) });

export const updateDriverSchema = z.object({
  params: z.object({ id: z.string().cuid('Invalid driver id') }),
  body: z.object(driverFields).partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update'),
});

export const updateDriverStatusSchema = z.object({
  params: z.object({ id: z.string().cuid('Invalid driver id') }),
  body: z.object({
    status: z.nativeEnum(DriverStatus, { errorMap: () => ({ message: 'Select a valid driver status' }) }),
  }),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>['body'];
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>['body'];
