import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';

const id = z.string().cuid('Invalid id');

export const createFuelLogSchema = z.object({
  body: z.object({
    vehicleId: id,
    tripId: id.optional(),
    date: z.coerce.date({ errorMap: () => ({ message: 'Enter a valid date' }) }),
    liters: z.coerce.number().positive('Litres must be greater than 0'),
    cost: z.coerce.number().nonnegative('Cost cannot be negative'),
    odometer: z.coerce.number().int().nonnegative('Odometer cannot be negative').optional(),
  }),
});

export const createExpenseSchema = z.object({
  body: z
    .object({
      vehicleId: id,
      tripId: id.optional(),
      category: z.nativeEnum(ExpenseCategory, { errorMap: () => ({ message: 'Select a valid category' }) }),
      toll: z.coerce.number().nonnegative('Toll cannot be negative').default(0),
      other: z.coerce.number().nonnegative('Other cannot be negative').default(0),
      note: z.string().trim().max(500, 'Note is too long').optional(),
    })
    .refine((v) => v.toll > 0 || v.other > 0, {
      message: 'Enter a toll or other amount greater than 0',
      path: ['toll'],
    }),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>['body'];
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>['body'];
