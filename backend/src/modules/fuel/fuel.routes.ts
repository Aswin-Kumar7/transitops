import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { fuelController } from './fuel.controller';
import { createExpenseSchema, createFuelLogSchema } from './fuel.validation';

/**
 * FUEL & EXPENSES (Member 3). Screen 6. Guarded under the 'fuel' module.
 * See docs/prompts/MEMBER-3-FINANCE.md.
 */
const router = Router();
router.use(authenticate, requireModule('fuel'));

router.get('/logs', asyncHandler(fuelController.listLogs));
router.post('/logs', validate(createFuelLogSchema), asyncHandler(fuelController.logFuel));
router.get('/expenses', asyncHandler(fuelController.listExpenses));
router.post('/expenses', validate(createExpenseSchema), asyncHandler(fuelController.addExpense));
router.get('/summary', asyncHandler(fuelController.summary));

export default router;
