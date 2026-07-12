import { z } from 'zod';

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;
export const DISTANCE_UNITS = ['Kilometers', 'Miles'] as const;

export const updateSettingsSchema = z.object({
  body: z.object({
    depotName: z.string().trim().min(2, 'Depot name is required').max(120, 'Depot name is too long'),
    currency: z.enum(CURRENCIES, { errorMap: () => ({ message: 'Select a supported currency' }) }),
    distanceUnit: z.enum(DISTANCE_UNITS, { errorMap: () => ({ message: 'Select a valid distance unit' }) }),
  }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
