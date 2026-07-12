import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { settingsController } from './settings.controller';
import { updateSettingsSchema } from './settings.validation';

/**
 * SETTINGS & RBAC (Member 3). Screen 8. Guarded under the 'settings' module.
 * GET is readable by settings-viewers; PUT requires 'full' (Fleet Manager).
 * The RBAC matrix is served read-only from config/permissions.ts.
 */
const router = Router();
router.use(authenticate, requireModule('settings'));

router.get('/', asyncHandler(settingsController.get));
router.put('/', validate(updateSettingsSchema), asyncHandler(settingsController.update));

export default router;
