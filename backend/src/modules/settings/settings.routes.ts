import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { PERMISSIONS } from '../../config/permissions';

/**
 * SETTINGS & RBAC (Member 3 for UI). Screen 8. Guarded under 'settings'.
 * GET is readable; write requires 'full' (Fleet Manager). The RBAC matrix itself
 * is served read-only from config/permissions.ts (single source of truth).
 */
const router = Router();
router.use(authenticate, requireModule('settings'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const setting = await prisma.setting.findUnique({ where: { id: 1 } });
    res.json({ general: setting, rbac: PERMISSIONS });
  }),
);

// TODO(Member 3): PUT / to update depotName/currency/distanceUnit (validated).
export default router;
