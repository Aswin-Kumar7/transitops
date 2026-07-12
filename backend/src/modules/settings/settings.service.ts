import { prisma } from '../../config/prisma';
import { PERMISSIONS } from '../../config/permissions';
import { UpdateSettingsInput } from './settings.validation';

const DEFAULTS = { depotName: 'Gandhinagar Depot GJ4', currency: 'INR', distanceUnit: 'Kilometers' };

export const settingsService = {
  async get() {
    // Settings is a singleton (id = 1); create it on first read if missing.
    const general = await prisma.setting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, ...DEFAULTS },
    });
    return { general, rbac: PERMISSIONS };
  },

  async update(data: UpdateSettingsInput) {
    const general = await prisma.setting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    return { general, rbac: PERMISSIONS };
  },
};
