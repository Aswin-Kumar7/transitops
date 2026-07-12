import { z } from 'zod';
import { Role } from '@prisma/client';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    // Role is chosen on the login screen; we verify it matches the account.
    role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Select a valid role' }) }).optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain a letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Select a valid role' }) }),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
