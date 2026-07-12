import { Router } from 'express';
import { Prisma, VehicleType, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

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

    // 7-day window for the activity trend line.
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const [statusGroups, tripStatusGroups, activeTrips, pendingTrips, driversOnDuty, regionRows, recentTrips, trendTrips] =
      await Promise.all([
        prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true }, where: vehicleWhere }),
        prisma.trip.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.trip.count({ where: { status: 'DISPATCHED' } }),
        prisma.trip.count({ where: { status: 'DRAFT' } }),
        prisma.driver.count({ where: { status: { in: ['AVAILABLE', 'ON_TRIP'] } } }),
        prisma.vehicle.findMany({ where: { region: { not: null } }, select: { region: true }, distinct: ['region'], orderBy: { region: 'asc' } }),
        prisma.trip.findMany({
          take: 6,
          orderBy: { updatedAt: 'desc' },
          include: { vehicle: { select: { name: true } }, driver: { select: { name: true } } },
        }),
        prisma.trip.findMany({ where: { createdAt: { gte: windowStart } }, select: { createdAt: true } }),
      ]);

    const countFor = (s: VehicleStatus) => statusGroups.find((g) => g.status === s)?._count._all ?? 0;
    const totalVehicles = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
    const onTrip = countFor('ON_TRIP');

    // Bucket trips into the last 7 days.
    const buckets = new Map<string, number>();
    for (const t of trendTrips) buckets.set(dayKey(t.createdAt), (buckets.get(dayKey(t.createdAt)) ?? 0) + 1);
    const activityTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      return { label: `${MONTHS[d.getMonth()]} ${d.getDate()}`, value: buckets.get(dayKey(d)) ?? 0 };
    });

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
      tripStatus: tripStatusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      activityTrend,
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
        startTime: t.dispatchedAt ?? (t.status === 'DRAFT' ? null : t.createdAt),
      })),
    });
  }),
);

export default router;
