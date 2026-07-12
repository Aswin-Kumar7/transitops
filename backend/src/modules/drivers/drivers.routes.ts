import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { driversController } from './drivers.controller';
import { createDriverSchema, updateDriverSchema, updateDriverStatusSchema } from './drivers.validation';

const router = Router();
router.use(authenticate, requireModule('drivers'));

router.get('/', asyncHandler(driversController.list));
router.post('/', validate(createDriverSchema), asyncHandler(driversController.create));
router.put('/:id', validate(updateDriverSchema), asyncHandler(driversController.update));
router.patch('/:id/status', validate(updateDriverStatusSchema), asyncHandler(driversController.updateStatus));

export default router;
