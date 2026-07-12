import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// All authenticated roles can see the dashboard summary.
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (_req, res) => {
    const [activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips, driversOnDuty, vehicleStatusGroups] =
      await Promise.all([
        prisma.vehicle.count({ where: { status: { in: ['AVAILABLE', 'ON_TRIP'] } } }),
        prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
        prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
        prisma.trip.count({ where: { status: 'DISPATCHED' } }),
        prisma.trip.count({ where: { status: 'DRAFT' } }),
        prisma.driver.count({ where: { status: { in: ['AVAILABLE', 'ON_TRIP'] } } }),
        prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
      ]);

    const totalVehicles = await prisma.vehicle.count();
    const onTrip = vehicleStatusGroups.find((g) => g.status === 'ON_TRIP')?._count._all ?? 0;
    const fleetUtilization = totalVehicles ? Math.round((onTrip / totalVehicles) * 100) : 0;

    const recentTrips = await prisma.trip.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      include: { vehicle: { select: { name: true } }, driver: { select: { name: true } } },
    });

    res.json({
      kpis: {
        activeVehicles,
        availableVehicles,
        inMaintenance,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization,
      },
      vehicleStatus: vehicleStatusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      recentTrips: recentTrips.map((t) => ({
        tripCode: t.tripCode,
        vehicle: t.vehicle?.name ?? '—',
        driver: t.driver?.name ?? '—',
        status: t.status,
      })),
    });
  }),
);

export default router;
