import { Prisma, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import {
  CreateVehicleInput,
  ListVehiclesQuery,
  UpdateVehicleInput,
  UpdateVehicleStatusInput,
} from './vehicles.validation';

const DUPLICATE_REG_MESSAGE = 'A vehicle with this registration number already exists';

async function assertRegistrationNoAvailable(registrationNo: string, excludeId?: string) {
  const existing = await prisma.vehicle.findUnique({ where: { registrationNo } });
  if (existing && existing.id !== excludeId) {
    throw ApiError.conflict(DUPLICATE_REG_MESSAGE);
  }
}

export const vehiclesService = {
  async list(filters: ListVehiclesQuery) {
    const where: Prisma.VehicleWhereInput = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.registrationNo = { contains: filters.search, mode: 'insensitive' };
    }
    return prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
  },

  async create(data: CreateVehicleInput) {
    await assertRegistrationNoAvailable(data.registrationNo);
    return prisma.vehicle.create({ data });
  },

  async update(id: string, data: UpdateVehicleInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    if (data.registrationNo !== vehicle.registrationNo) {
      await assertRegistrationNoAvailable(data.registrationNo, id);
    }

    return prisma.vehicle.update({ where: { id }, data });
  },

  async updateStatus(id: string, { status }: UpdateVehicleStatusInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    const managedElsewhere: VehicleStatus[] = ['ON_TRIP', 'IN_SHOP'];
    if (managedElsewhere.includes(vehicle.status)) {
      throw ApiError.badRequest(
        `Vehicle status is managed by ${vehicle.status === 'ON_TRIP' ? 'Trips' : 'Maintenance'} while ${vehicle.status.replace('_', ' ')}`,
      );
    }

    if (vehicle.status === status) {
      throw ApiError.badRequest(`Vehicle is already ${status}`);
    }

    return prisma.vehicle.update({ where: { id }, data: { status } });
  },
};
