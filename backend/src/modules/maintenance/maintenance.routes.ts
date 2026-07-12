import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { maintenanceController } from './maintenance.controller';
import { closeMaintenanceSchema, createMaintenanceSchema } from './maintenance.validation';

/**
 * MAINTENANCE (Member 1). Screen 5. Guarded under the 'fleet' module.
 * See docs/prompts/MEMBER-1-FLEET.md.
 */
const router = Router();
router.use(authenticate, requireModule('fleet'));

router.get('/', asyncHandler(maintenanceController.list));
router.post('/', validate(createMaintenanceSchema), asyncHandler(maintenanceController.logService));
router.patch(
  '/:id/close',
  validate(closeMaintenanceSchema),
  asyncHandler(maintenanceController.closeService),
);

export default router;
