import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    app.listen(env.PORT, () => {
      console.log(`🚚 TransitOps API running on http://localhost:${env.PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
