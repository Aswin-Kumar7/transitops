import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * FUEL & EXPENSES (Member 3). Screen 6. Guarded under the 'fuel' module.
 * TODO(Member 3): log fuel, add expense (toll/other), compute
 * "total operational cost = fuel + maintenance". Numeric validation on liters/cost.
 * See docs/prompts/MEMBER-3-FINANCE.md.
 */
const router = Router();
router.use(authenticate, requireModule('fuel'));

router.get(
  '/logs',
  asyncHandler(async (_req, res) => {
    const logs = await prisma.fuelLog.findMany({
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { name: true } } },
    });
    res.json(logs);
  }),
);

router.get(
  '/expenses',
  asyncHandler(async (_req, res) => {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { name: true } }, trip: { select: { tripCode: true } } },
    });
    res.json(expenses);
  }),
);

export default router;
