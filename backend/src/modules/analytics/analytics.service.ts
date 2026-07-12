import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Prisma Decimal | null -> number. */
const dec = (v: Prisma.Decimal | null | undefined) => (v ? v.toNumber() : 0);

/**
 * All figures follow the PINNED formulas in docs/INTEGRATION-CONTRACT.md §6 so
 * the dashboard and analytics never disagree. Aggregations run in SQL.
 */
export const analyticsService = {
  async overview() {
    const [
      totalVehicles,
      onTripVehicles,
      vehicles,
      fuelAgg,
      maintenanceAgg,
      completedTrips,
      fuelByVehicle,
      maintByVehicle,
      revenueByVehicle,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
      prisma.vehicle.findMany({ select: { id: true, name: true, registrationNo: true, acquisitionCost: true } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.maintenanceRecord.aggregate({ _sum: { cost: true } }),
      prisma.trip.findMany({
        where: { status: 'COMPLETED' },
        select: { revenue: true, plannedDistanceKm: true, startOdometer: true, endOdometer: true, completedAt: true },
      }),
      prisma.fuelLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } }),
      prisma.maintenanceRecord.groupBy({ by: ['vehicleId'], _sum: { cost: true } }),
      prisma.trip.groupBy({ by: ['vehicleId'], where: { status: 'COMPLETED' }, _sum: { revenue: true } }),
    ]);

    // Fleet utilization — identical to the dashboard.
    const fleetUtilization = totalVehicles ? Math.round((onTripVehicles / totalVehicles) * 100) : 0;

    // Fuel efficiency = total completed-trip distance / total litres.
    const totalLitres = dec(fuelAgg._sum.liters);
    const totalDistance = completedTrips.reduce((sum, t) => {
      const actual = t.startOdometer != null && t.endOdometer != null ? t.endOdometer - t.startOdometer : t.plannedDistanceKm;
      return sum + Math.max(0, actual);
    }, 0);
    const fuelEfficiency = totalLitres > 0 ? Number((totalDistance / totalLitres).toFixed(2)) : 0;

    // Operational cost = fuel + maintenance.
    const totalFuelCost = dec(fuelAgg._sum.cost);
    const totalMaintenanceCost = dec(maintenanceAgg._sum.cost);
    const operationalCost = totalFuelCost + totalMaintenanceCost;

    // Fleet ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost.
    const totalRevenue = completedTrips.reduce((s, t) => s + dec(t.revenue), 0);
    const totalAcquisition = vehicles.reduce((s, v) => s + dec(v.acquisitionCost), 0);
    const vehicleRoi = totalAcquisition > 0
      ? Number((((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / totalAcquisition) * 100).toFixed(1))
      : 0;

    // Monthly revenue from completed trips, grouped by YYYY-MM.
    const monthlyMap = new Map<string, number>();
    for (const t of completedTrips) {
      if (!t.completedAt) continue;
      const key = `${t.completedAt.getUTCFullYear()}-${String(t.completedAt.getUTCMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + dec(t.revenue));
    }
    const monthlyRevenue = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    // Per-vehicle cost + ROI, and the top costliest.
    const fuelMap = new Map(fuelByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
    const maintMap = new Map(maintByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
    const revMap = new Map(revenueByVehicle.map((r) => [r.vehicleId, dec(r._sum.revenue)]));

    const perVehicle = vehicles.map((v) => {
      const fuelCost = fuelMap.get(v.id) ?? 0;
      const maintenanceCost = maintMap.get(v.id) ?? 0;
      const revenue = revMap.get(v.id) ?? 0;
      const acquisition = dec(v.acquisitionCost);
      const cost = fuelCost + maintenanceCost;
      const roi = acquisition > 0 ? Number((((revenue - cost) / acquisition) * 100).toFixed(1)) : 0;
      return { id: v.id, name: v.name, registrationNo: v.registrationNo, fuelCost, maintenanceCost, cost, revenue, roi };
    });

    const topCostliestVehicles = [...perVehicle]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map((v) => ({ name: v.name, cost: v.cost }));

    return {
      fuelEfficiency,
      fleetUtilization,
      operationalCost,
      vehicleRoi,
      monthlyRevenue,
      topCostliestVehicles,
      perVehicle,
    };
  },
};
