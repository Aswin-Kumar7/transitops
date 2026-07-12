import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireModule } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * REPORTS & ANALYTICS (Member 3). Screen 7. Guarded under the 'analytics' module.
 * TODO(Member 3): fuel efficiency (km/l), fleet utilization, operational cost,
 * vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost,
 * monthly revenue series, top costliest vehicles.
 * See docs/prompts/MEMBER-3-FINANCE.md.
 */
const router = Router();
router.use(authenticate, requireModule('analytics'));

router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    // Placeholder shape — Member 3 replaces with real aggregations.
    res.json({
      fuelEfficiency: null,
      fleetUtilization: null,
      operationalCost: null,
      vehicleRoi: null,
      monthlyRevenue: [],
      topCostliestVehicles: [],
      note: 'TODO(Member 3): implement analytics aggregations',
    });
  }),
);

export default router;
