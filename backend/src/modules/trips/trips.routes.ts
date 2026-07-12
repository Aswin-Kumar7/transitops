import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * TRIP DISPATCHER (Member 2). Screen 4. Guarded under the 'trips' module.
 * TODO(Member 2): create trip (DRAFT), dispatch (capacity + driver/vehicle checks),
 * complete (capture odometer -> auto fuel/expense hook -> free vehicle & driver),
 * cancel. Only AVAILABLE vehicles/drivers are selectable. Lifecycle:
 * DRAFT -> DISPATCHED -> COMPLETED | CANCELLED.
 * See docs/prompts/MEMBER-2-OPERATIONS.md.
 */
const router = Router();
router.use(authenticate, requireModule('trips'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { name: true } }, driver: { select: { name: true } } },
    });
    res.json(trips);
  }),
);

export default router;
