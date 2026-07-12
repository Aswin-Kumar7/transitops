import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * DRIVERS & SAFETY (Member 2). Screen 3. Guarded under the 'drivers' module.
 * TODO(Member 2): add/edit drivers, toggle status, unique-license validation.
 * Business rule: expired license OR SUSPENDED status => not assignable to trips.
 * Expose an "assignable" flag (derived) for the Trip Dispatcher.
 * See docs/prompts/MEMBER-2-OPERATIONS.md.
 */
const router = Router();
router.use(authenticate, requireModule('drivers'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const drivers = await prisma.driver.findMany({ orderBy: { name: 'asc' } });
    const now = new Date();
    res.json(
      drivers.map((d) => ({
        ...d,
        assignable: d.status !== 'SUSPENDED' && d.status !== 'OFF_DUTY' && d.licenseExpiry > now,
        licenseExpired: d.licenseExpiry <= now,
      })),
    );
  }),
);

export default router;
