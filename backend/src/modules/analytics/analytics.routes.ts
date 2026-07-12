import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { analyticsController } from './analytics.controller';

/**
 * REPORTS & ANALYTICS (Member 3). Screen 7. Guarded under the 'analytics' module.
 * See docs/prompts/MEMBER-3-FINANCE.md.
 */
const router = Router();
router.use(authenticate, requireModule('analytics'));

router.get('/overview', asyncHandler(analyticsController.overview));

export default router;
