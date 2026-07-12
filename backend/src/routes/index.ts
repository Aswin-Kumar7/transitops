import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import vehicleRoutes from '../modules/vehicles/vehicles.routes';
import maintenanceRoutes from '../modules/maintenance/maintenance.routes';
import driverRoutes from '../modules/drivers/drivers.routes';
import tripRoutes from '../modules/trips/trips.routes';
import fuelRoutes from '../modules/fuel/fuel.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import settingsRoutes from '../modules/settings/settings.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'transitops-api' }));

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/drivers', driverRoutes);
router.use('/trips', tripRoutes);
router.use('/fuel', fuelRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingsRoutes);

export default router;
