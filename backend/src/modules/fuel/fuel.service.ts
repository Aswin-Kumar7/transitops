import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { CreateExpenseInput, CreateFuelLogInput } from './fuel.validation';

const toNumber = (value: unknown) => Number(value ?? 0);

async function assertVehicleExists(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) throw ApiError.badRequest('Selected vehicle does not exist', { vehicleId: 'Choose a valid vehicle' });
}

async function assertTripExists(tripId?: string) {
  if (!tripId) return;
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true } });
  if (!trip) throw ApiError.badRequest('Selected trip does not exist', { tripId: 'Choose a valid trip' });
}

export const fuelService = {
  async listLogs() {
    return prisma.fuelLog.findMany({
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { name: true, registrationNo: true } }, trip: { select: { tripCode: true } } },
    });
  },

  async listExpenses() {
    return prisma.expense.findMany({
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { name: true, registrationNo: true } }, trip: { select: { tripCode: true } } },
    });
  },

  async logFuel(data: CreateFuelLogInput) {
    await assertVehicleExists(data.vehicleId);
    await assertTripExists(data.tripId);
    return prisma.fuelLog.create({
      data: {
        vehicleId: data.vehicleId,
        tripId: data.tripId,
        date: data.date,
        liters: data.liters,
        cost: data.cost,
        odometer: data.odometer,
      },
    });
  },

  async addExpense(data: CreateExpenseInput) {
    await assertVehicleExists(data.vehicleId);
    await assertTripExists(data.tripId);
    return prisma.expense.create({
      data: {
        vehicleId: data.vehicleId,
        tripId: data.tripId,
        category: data.category,
        toll: data.toll,
        other: data.other,
        note: data.note,
      },
    });
  },

  /**
   * Total Operational Cost = Fuel + Maintenance (matches screen 6 + the pinned
   * formula in docs/INTEGRATION-CONTRACT.md). Toll/other expenses are reported
   * separately in the breakdown.
   */
  async summary() {
    const [fuel, maintenance, expenses] = await Promise.all([
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.maintenanceRecord.aggregate({ _sum: { cost: true } }),
      prisma.expense.aggregate({ _sum: { toll: true, other: true } }),
    ]);

    const fuelCost = toNumber(fuel._sum.cost);
    const maintenanceCost = toNumber(maintenance._sum.cost);
    const tollTotal = toNumber(expenses._sum.toll);
    const otherTotal = toNumber(expenses._sum.other);

    return {
      fuelCost,
      maintenanceCost,
      tollTotal,
      otherTotal,
      litresTotal: toNumber(fuel._sum.liters),
      // Headline figure shown on the Fuel & Expenses screen.
      totalOperationalCost: fuelCost + maintenanceCost,
    };
  },
};
