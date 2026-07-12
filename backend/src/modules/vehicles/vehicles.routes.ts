import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * FLEET — Vehicle Registry (Member 1). Screen 2.
 * Base provides a guarded read so the app runs end-to-end.
 * TODO(Member 1): add create/update/retire, unique-reg validation, filters.
 * See docs/prompts/MEMBER-1-FLEET.md.
 */
const router = Router();
router.use(authenticate, requireModule('fleet'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(vehicles);
  }),
);

export default router;
