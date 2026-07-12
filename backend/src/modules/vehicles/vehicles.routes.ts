import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { vehiclesController } from './vehicles.controller';
import {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
} from './vehicles.validation';

/**
 * FLEET — Vehicle Registry (Member 1). Screen 2.
 * See docs/prompts/MEMBER-1-FLEET.md.
 */
const router = Router();
router.use(authenticate, requireModule('fleet'));

router.get('/', validate(listVehiclesQuerySchema), asyncHandler(vehiclesController.list));
router.post('/', validate(createVehicleSchema), asyncHandler(vehiclesController.create));
router.put('/:id', validate(updateVehicleSchema), asyncHandler(vehiclesController.update));
router.patch(
  '/:id/status',
  validate(updateVehicleStatusSchema),
  asyncHandler(vehiclesController.updateStatus),
);

export default router;
