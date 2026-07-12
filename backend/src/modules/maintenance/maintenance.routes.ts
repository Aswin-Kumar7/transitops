import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * MAINTENANCE (Member 1). Screen 5. Guarded under the 'fleet' module.
 * TODO(Member 1): logService (Vehicle AVAILABLE -> IN_SHOP, create record),
 * closeService (IN_SHOP -> AVAILABLE). In-Shop vehicles must leave the dispatch pool.
 * See docs/prompts/MEMBER-1-FLEET.md.
 */
const router = Router();
router.use(authenticate, requireModule('fleet'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const records = await prisma.maintenanceRecord.findMany({
      orderBy: { serviceDate: 'desc' },
      include: { vehicle: { select: { name: true, registrationNo: true } } },
    });
    res.json(records);
  }),
);

export default router;
