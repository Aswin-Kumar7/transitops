import bcrypt from 'bcryptjs';
import { PrismaClient, Role, VehicleType, VehicleStatus, LicenseCategory, DriverStatus, TripStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TransitOps...');

  // ── Users (one per RBAC role) ────────────────────────────────
  const passwordHash = await bcrypt.hash('Passw0rd!', 10);
  const users: Array<{ name: string; email: string; role: Role }> = [
    { name: 'Raven K.', email: 'manager@transitops.in', role: Role.FLEET_MANAGER },
    { name: 'Dev Dispatcher', email: 'dispatcher@transitops.in', role: Role.DISPATCHER },
    { name: 'Sana Safety', email: 'safety@transitops.in', role: Role.SAFETY_OFFICER },
    { name: 'Fin Analyst', email: 'finance@transitops.in', role: Role.FINANCIAL_ANALYST },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  // ── Settings singleton ───────────────────────────────────────
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, depotName: 'Gandhinagar Depot GJ4', currency: 'INR', distanceUnit: 'Kilometers' },
  });

  // ── Vehicles ─────────────────────────────────────────────────
  const vehicles = [
    { registrationNo: 'GJ01AB4521', name: 'VAN-05', type: VehicleType.VAN, capacityKg: 500, odometer: 74000, acquisitionCost: 620000, status: VehicleStatus.AVAILABLE, region: 'Gandhinagar' },
    { registrationNo: 'GJ01AB9981', name: 'TRUCK-11', type: VehicleType.TRUCK, capacityKg: 5000, odometer: 182000, acquisitionCost: 2450000, status: VehicleStatus.ON_TRIP, region: 'Ahmedabad' },
    { registrationNo: 'GJ01AB1120', name: 'MINI-03', type: VehicleType.MINI, capacityKg: 1000, odometer: 66000, acquisitionCost: 410000, status: VehicleStatus.IN_SHOP, region: 'Sanand' },
    { registrationNo: 'GJ01AB0087', name: 'VAN-09', type: VehicleType.VAN, capacityKg: 750, odometer: 241900, acquisitionCost: 590000, status: VehicleStatus.RETIRED, region: 'Kalol' },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { registrationNo: v.registrationNo }, update: { region: v.region }, create: v });
  }

  // ── Drivers ──────────────────────────────────────────────────
  const drivers = [
    { name: 'Alex', licenseNo: 'DL-88213', licenseCategory: LicenseCategory.LMV, licenseExpiry: new Date('2028-12-31'), contact: '98765xxxxx', tripCompletionRate: 96, status: DriverStatus.AVAILABLE },
    { name: 'John', licenseNo: 'DL-44120', licenseCategory: LicenseCategory.HMV, licenseExpiry: new Date('2025-03-31'), contact: '98220xxxxx', tripCompletionRate: 81, status: DriverStatus.SUSPENDED },
    { name: 'Priya', licenseNo: 'DL-77031', licenseCategory: LicenseCategory.LMV, licenseExpiry: new Date('2027-08-31'), contact: '99110xxxxx', tripCompletionRate: 99, status: DriverStatus.ON_TRIP },
    { name: 'Suresh', licenseNo: 'DL-90045', licenseCategory: LicenseCategory.HMV, licenseExpiry: new Date('2027-01-31'), contact: '97440xxxxx', tripCompletionRate: 88, status: DriverStatus.OFF_DUTY },
  ];
  for (const d of drivers) {
    await prisma.driver.upsert({ where: { licenseNo: d.licenseNo }, update: {}, create: d });
  }

  // ── A couple of trips for the dashboard/live board ───────────
  const van05 = await prisma.vehicle.findUnique({ where: { registrationNo: 'GJ01AB4521' } });
  const alex = await prisma.driver.findUnique({ where: { licenseNo: 'DL-88213' } });
  if (van05 && alex) {
    await prisma.trip.upsert({
      where: { tripCode: 'TR001' },
      update: {},
      create: {
        tripCode: 'TR001', source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub',
        cargoWeightKg: 400, plannedDistanceKm: 45, status: TripStatus.DISPATCHED,
        vehicleId: van05.id, driverId: alex.id, dispatchedAt: new Date(), revenue: 5000,
      },
    });
    await prisma.trip.upsert({
      where: { tripCode: 'TR006' },
      update: {},
      create: {
        tripCode: 'TR006', source: 'Mansa', destination: 'Kalol Depot',
        cargoWeightKg: 300, plannedDistanceKm: 30, status: TripStatus.DRAFT,
      },
    });
  }

  console.log('✅ Seed complete. Login with any *@transitops.in / Passw0rd!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
