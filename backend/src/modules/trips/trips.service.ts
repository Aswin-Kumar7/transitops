import { DriverStatus, Prisma, TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { isDriverAssignable, startOfToday } from '../drivers/drivers.rules';
import type { CancelTripInput, CompleteTripInput, CreateTripInput, DispatchTripInput } from './trips.validation';

const boardInclude = {
  vehicle: { select: { id: true, name: true, registrationNo: true, capacityKg: true, odometer: true, status: true } },
  driver: { select: { id: true, name: true, licenseNo: true, status: true, licenseExpiry: true } },
} satisfies Prisma.TripInclude;

const tripCode = (n: number) => `TR${String(n).padStart(3, '0')}`;

const nextTripCode = async (tx: Prisma.TransactionClient) => {
  const latest = await tx.trip.findFirst({ orderBy: { createdAt: 'desc' }, select: { tripCode: true } });
  const previous = latest ? Number(latest.tripCode.replace(/^TR/, '')) : 0;
  return tripCode(Number.isFinite(previous) ? previous + 1 : 1);
};

export const tripsService = {
  async list() {
    return prisma.trip.findMany({ orderBy: { createdAt: 'desc' }, include: boardInclude });
  },

  async options() {
    const today = startOfToday();
    const [vehicles, drivers] = await Promise.all([
      prisma.vehicle.findMany({ where: { status: VehicleStatus.AVAILABLE }, orderBy: { name: 'asc' } }),
      prisma.driver.findMany({
        where: { status: DriverStatus.AVAILABLE, licenseExpiry: { gte: today } },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { vehicles, drivers };
  },

  async create(input: CreateTripInput, createdById?: string) {
    return prisma.$transaction(async (tx) => {
      const [vehicle, driver] = await Promise.all([
        input.vehicleId ? tx.vehicle.findUnique({ where: { id: input.vehicleId }, select: { id: true } }) : null,
        input.driverId ? tx.driver.findUnique({ where: { id: input.driverId }, select: { id: true } }) : null,
      ]);
      if (input.vehicleId && !vehicle) {
        throw ApiError.badRequest('Selected vehicle no longer exists', { vehicleId: 'Select an available vehicle' });
      }
      if (input.driverId && !driver) {
        throw ApiError.badRequest('Selected driver no longer exists', { driverId: 'Select an eligible driver' });
      }

      const code = await nextTripCode(tx);
      return tx.trip.create({
        data: { ...input, tripCode: code, createdById },
        include: boardInclude,
      });
    });
  },

  async dispatch(id: string, input: DispatchTripInput) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw ApiError.notFound('Trip not found');
      if (trip.status !== TripStatus.DRAFT) throw ApiError.badRequest('Only draft trips can be dispatched');

      const vehicleId = input.vehicleId ?? trip.vehicleId;
      const driverId = input.driverId ?? trip.driverId;
      if (!vehicleId || !driverId) {
        throw ApiError.badRequest('Choose an available vehicle and driver before dispatching', {
          ...(vehicleId ? {} : { vehicleId: 'Vehicle is required for dispatch' }),
          ...(driverId ? {} : { driverId: 'Driver is required for dispatch' }),
        });
      }

      const [vehicle, driver] = await Promise.all([
        tx.vehicle.findUnique({ where: { id: vehicleId } }),
        tx.driver.findUnique({ where: { id: driverId } }),
      ]);
      if (!vehicle) throw ApiError.badRequest('Selected vehicle no longer exists');
      if (!driver) throw ApiError.badRequest('Selected driver no longer exists');
      if (vehicle.status !== VehicleStatus.AVAILABLE) throw ApiError.badRequest('Selected vehicle is no longer available for dispatch');
      if (driver.status !== DriverStatus.AVAILABLE || !isDriverAssignable(driver)) {
        throw ApiError.badRequest('Selected driver is not available or has an expired license');
      }
      if (trip.cargoWeightKg > vehicle.capacityKg) {
        throw ApiError.badRequest(`Capacity exceeded by ${trip.cargoWeightKg - vehicle.capacityKg} kg — dispatch blocked`, {
          cargoWeightKg: 'Cargo weight exceeds the selected vehicle capacity',
        });
      }

      const dispatchedAt = new Date();
      await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: VehicleStatus.ON_TRIP } });
      await tx.driver.update({ where: { id: driver.id }, data: { status: DriverStatus.ON_TRIP } });
      return tx.trip.update({
        where: { id },
        data: {
          vehicleId: vehicle.id,
          driverId: driver.id,
          status: TripStatus.DISPATCHED,
          dispatchedAt,
          startOdometer: vehicle.odometer,
        },
        include: boardInclude,
      });
    });
  },

  async complete(id: string, input: CompleteTripInput) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw ApiError.notFound('Trip not found');
      if (trip.status !== TripStatus.DISPATCHED) throw ApiError.badRequest('Only dispatched trips can be completed');
      if (!trip.vehicleId || !trip.driverId || trip.startOdometer === null) {
        throw ApiError.badRequest('This dispatched trip is missing its vehicle, driver, or start odometer');
      }
      if (input.endOdometer < trip.startOdometer) {
        throw ApiError.badRequest('End odometer must be greater than or equal to the start odometer', {
          endOdometer: `Must be at least ${trip.startOdometer}`,
        });
      }

      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE, odometer: input.endOdometer } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
      return tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
          endOdometer: input.endOdometer,
          revenue: input.revenue ?? trip.revenue ?? 0,
        },
        include: boardInclude,
      });
    });
  },

  async cancel(id: string, input: CancelTripInput) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw ApiError.notFound('Trip not found');
      if (trip.status !== TripStatus.DRAFT && trip.status !== TripStatus.DISPATCHED) {
        throw ApiError.badRequest('Only draft or dispatched trips can be cancelled');
      }

      if (trip.status === TripStatus.DISPATCHED) {
        if (trip.vehicleId) await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
        if (trip.driverId) await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
      }
      return tx.trip.update({
        where: { id },
        data: { status: TripStatus.CANCELLED, cancelledAt: new Date(), cancelReason: input.cancelReason },
        include: boardInclude,
      });
    });
  },
};
