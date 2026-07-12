import { Router } from 'express';
import { Prisma, VehicleType, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// All authenticated roles can see the dashboard summary.
// Optional filters (?type=&status=&region=) scope the vehicle-derived metrics.
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const { type, status, region } = req.query as Record<string, string | undefined>;

    const vehicleWhere: Prisma.VehicleWhereInput = {};
    if (type && type in VehicleType) vehicleWhere.type = type as VehicleType;
    if (status && status in VehicleStatus) vehicleWhere.status = status as VehicleStatus;
    if (region) vehicleWhere.region = region;

    const [statusGroups, activeTrips, pendingTrips, driversOnDuty, regionRows, recentTrips] = await Promise.all([
      prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true }, where: vehicleWhere }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.driver.count({ where: { status: { in: ['AVAILABLE', 'ON_TRIP'] } } }),
      prisma.vehicle.findMany({ where: { region: { not: null } }, select: { region: true }, distinct: ['region'], orderBy: { region: 'asc' } }),
      prisma.trip.findMany({
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: { vehicle: { select: { name: true } }, driver: { select: { name: true } } },
      }),
    ]);

    const countFor = (s: VehicleStatus) => statusGroups.find((g) => g.status === s)?._count._all ?? 0;
    const totalVehicles = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
    const onTrip = countFor('ON_TRIP');

    res.json({
      kpis: {
        activeVehicles: countFor('AVAILABLE') + onTrip,
        availableVehicles: countFor('AVAILABLE'),
        inMaintenance: countFor('IN_SHOP'),
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization: totalVehicles ? Math.round((onTrip / totalVehicles) * 100) : 0,
      },
      vehicleStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      filters: {
        types: Object.values(VehicleType),
        statuses: Object.values(VehicleStatus),
        regions: regionRows.map((r) => r.region).filter(Boolean),
      },
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
