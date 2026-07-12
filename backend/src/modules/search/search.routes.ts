import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { canRead } from '../../config/permissions';

/**
 * Global search across vehicles, drivers, and trips — but only within the modules
 * the caller's role can read (RBAC-scoped). Powers the top-bar search box.
 */
const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = ((req.query.q as string) ?? '').trim();
    const role = req.user!.role as Role;
    if (q.length < 2) {
      return res.json({ vehicles: [], drivers: [], trips: [] });
    }
    const ci = { contains: q, mode: 'insensitive' as const };

    const [vehicles, drivers, trips] = await Promise.all([
      canRead(role, 'fleet')
        ? prisma.vehicle.findMany({
            where: { OR: [{ registrationNo: ci }, { name: ci }] },
            select: { id: true, name: true, registrationNo: true, status: true },
            take: 5,
          })
        : Promise.resolve([]),
      canRead(role, 'drivers')
        ? prisma.driver.findMany({
            where: { OR: [{ name: ci }, { licenseNo: ci }] },
            select: { id: true, name: true, licenseNo: true, status: true },
            take: 5,
          })
        : Promise.resolve([]),
      canRead(role, 'trips')
        ? prisma.trip.findMany({
            where: { OR: [{ tripCode: ci }, { source: ci }, { destination: ci }] },
            select: { id: true, tripCode: true, source: true, destination: true, status: true },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    res.json({ vehicles, drivers, trips });
  }),
);

export default router;
