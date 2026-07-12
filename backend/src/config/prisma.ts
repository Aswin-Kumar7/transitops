import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Single shared Prisma client for the whole app.
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
