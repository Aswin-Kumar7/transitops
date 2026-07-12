import { DriverStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import type { CreateDriverInput, UpdateDriverInput } from './drivers.validation';
import { toDriverResponse } from './drivers.rules';

export { toDriverResponse } from './drivers.rules';

export const driversService = {
  async list() {
    const drivers = await prisma.driver.findMany({ orderBy: { name: 'asc' } });
    return drivers.map(toDriverResponse);
  },

  async create(input: CreateDriverInput) {
    const existing = await prisma.driver.findUnique({ where: { licenseNo: input.licenseNo } });
    if (existing) throw ApiError.conflict('A driver with this license number already exists', { licenseNo: 'License number must be unique' });

    const driver = await prisma.driver.create({ data: input });
    return toDriverResponse(driver);
  },

  async update(id: string, input: UpdateDriverInput) {
    if (input.licenseNo) {
      const existing = await prisma.driver.findUnique({ where: { licenseNo: input.licenseNo } });
      if (existing && existing.id !== id) {
        throw ApiError.conflict('A driver with this license number already exists', { licenseNo: 'License number must be unique' });
      }
    }
    const driver = await prisma.driver.update({ where: { id }, data: input });
    return toDriverResponse(driver);
  },

  async updateStatus(id: string, status: DriverStatus) {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw ApiError.notFound('Driver not found');

    const activeTrip = await prisma.trip.findFirst({ where: { driverId: id, status: 'DISPATCHED' } });
    if (activeTrip && status !== DriverStatus.ON_TRIP) {
      throw ApiError.badRequest('This driver is assigned to a dispatched trip and must remain On Trip');
    }
    if (!activeTrip && status === DriverStatus.ON_TRIP) {
      throw ApiError.badRequest('Drivers are marked On Trip only when a trip is dispatched');
    }

    const updated = await prisma.driver.update({ where: { id }, data: { status } });
    return toDriverResponse(updated);
  },
};
