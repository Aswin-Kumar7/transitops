import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { tripsController } from './trips.controller';
import { cancelTripSchema, completeTripSchema, createTripSchema, dispatchTripSchema } from './trips.validation';

const router = Router();
router.use(authenticate, requireModule('trips'));

router.get('/', asyncHandler(tripsController.list));
router.get('/options', asyncHandler(tripsController.options));
router.post('/', validate(createTripSchema), asyncHandler(tripsController.create));
router.patch('/:id/dispatch', validate(dispatchTripSchema), asyncHandler(tripsController.dispatch));
router.patch('/:id/complete', validate(completeTripSchema), asyncHandler(tripsController.complete));
router.patch('/:id/cancel', validate(cancelTripSchema), asyncHandler(tripsController.cancel));

export default router;
