import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { CreateMaintenanceInput } from './maintenance.validation';

export const maintenanceService = {
  async list() {
    return prisma.maintenanceRecord.findMany({
      orderBy: { serviceDate: 'desc' },
      include: { vehicle: { select: { name: true, registrationNo: true } } },
    });
  },

  async logService(data: CreateMaintenanceInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    if (vehicle.status === 'ON_TRIP') {
      throw ApiError.badRequest('Finish the trip first');
    }
    if (vehicle.status === 'RETIRED') {
      throw ApiError.badRequest('Retired vehicles cannot be sent for service');
    }
    if (vehicle.status === 'IN_SHOP') {
      throw ApiError.badRequest('Vehicle is already in service');
    }

    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({
        data: {
          vehicleId: data.vehicleId,
          serviceType: data.serviceType,
          cost: data.cost,
          serviceDate: data.serviceDate,
          notes: data.notes,
          status: 'IN_SHOP',
        },
      });
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SHOP' } });
      return record;
    });
  },

  async closeService(id: string) {
    const record = await prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!record) throw ApiError.notFound('Maintenance record not found');
    if (record.status === 'COMPLETED') {
      throw ApiError.badRequest('This service record is already closed');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRecord.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
      await tx.vehicle.update({ where: { id: record.vehicleId }, data: { status: 'AVAILABLE' } });
      return updated;
    });
  },
};
