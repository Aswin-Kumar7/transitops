import bcrypt from 'bcryptjs';
import {
  PrismaClient, Role, VehicleType, VehicleStatus, LicenseCategory, DriverStatus, TripStatus, MaintenanceStatus, ExpenseCategory,
} from '@prisma/client';

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const chance = (p: number) => Math.random() < p;
const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86400000 - randInt(0, 20) * 3600000);

const REGIONS = ['Gandhinagar', 'Ahmedabad', 'Sanand', 'Kalol', 'Mehsana', 'Vadodara'];
const PLACES = ['Gandhinagar Depot', 'Ahmedabad Hub', 'Vatva Industrial Area', 'Sanand Warehouse', 'Kalol Depot', 'Mansa', 'Mehsana Yard', 'Vadodara Center', 'Nadiad Point', 'Anand Hub'];
const NAMES = ['Alex', 'John', 'Priya', 'Suresh', 'Ravi', 'Meena', 'Kiran', 'Arjun', 'Neha', 'Vikram', 'Sanjay', 'Pooja', 'Amit', 'Deepa', 'Rahul', 'Farah', 'Imran', 'Nitin'];
const SERVICES = ['Oil Change', 'Engine Repair', 'Tyre Replace', 'Brake Service', 'Battery Check', 'AC Repair'];

async function main() {
  console.log('🌱 Seeding TransitOps (rich dataset)...');

  // ── Users (stable demo logins) ───────────────────────────────
  const passwordHash = await bcrypt.hash('Passw0rd!', 10);
  const users: Array<{ name: string; email: string; role: Role }> = [
    { name: 'Raven K.', email: 'manager@transitops.in', role: Role.FLEET_MANAGER },
    { name: 'Dev Dispatcher', email: 'dispatcher@transitops.in', role: Role.DISPATCHER },
    { name: 'Sana Safety', email: 'safety@transitops.in', role: Role.SAFETY_OFFICER },
    { name: 'Fin Analyst', email: 'finance@transitops.in', role: Role.FINANCIAL_ANALYST },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash } });
  }

  await prisma.setting.upsert({
    where: { id: 1 }, update: {},
    create: { id: 1, depotName: 'Gandhinagar Depot GJ4', currency: 'INR', distanceUnit: 'Kilometers' },
  });

  // ── Wipe transactional data for a clean rich reseed ──────────
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();

  // ── Vehicles (~24) ───────────────────────────────────────────
  const vehicleData: any[] = [];
  const makeReg = (i: number) => `GJ01${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 7) % 26))}${1000 + i}`;
  const vehStatus = (i: number): VehicleStatus =>
    i % 12 === 0 ? VehicleStatus.RETIRED : i % 5 === 0 ? VehicleStatus.IN_SHOP : i % 3 === 0 ? VehicleStatus.ON_TRIP : VehicleStatus.AVAILABLE;
  let vi = 0;
  for (let n = 1; n <= 10; n++) vehicleData.push({ registrationNo: makeReg(vi), name: `VAN-${String(n).padStart(2, '0')}`, type: VehicleType.VAN, capacityKg: randInt(400, 1000), odometer: randInt(20000, 240000), acquisitionCost: randInt(450000, 800000), status: vehStatus(vi), region: pick(REGIONS) }) && vi++;
  for (let n = 1; n <= 8; n++) vehicleData.push({ registrationNo: makeReg(vi), name: `TRUCK-${String(n).padStart(2, '0')}`, type: VehicleType.TRUCK, capacityKg: randInt(3000, 8000), odometer: randInt(80000, 300000), acquisitionCost: randInt(1800000, 3200000), status: vehStatus(vi), region: pick(REGIONS) }) && vi++;
  for (let n = 1; n <= 6; n++) vehicleData.push({ registrationNo: makeReg(vi), name: `MINI-${String(n).padStart(2, '0')}`, type: VehicleType.MINI, capacityKg: randInt(700, 1500), odometer: randInt(15000, 120000), acquisitionCost: randInt(350000, 550000), status: vehStatus(vi), region: pick(REGIONS) }) && vi++;
  await prisma.vehicle.createMany({ data: vehicleData });
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, odometer: true, capacityKg: true } });

  // ── Drivers (~16) ────────────────────────────────────────────
  const driverData = NAMES.slice(0, 16).map((name, i) => ({
    name,
    licenseNo: `DL-${10000 + i * 137}`,
    licenseCategory: i % 2 === 0 ? LicenseCategory.LMV : LicenseCategory.HMV,
    licenseExpiry: chance(0.15) ? daysAgo(randInt(10, 200)) : new Date(NOW + randInt(120, 1200) * 86400000),
    contact: `9${randInt(700000000, 999999999)}`,
    tripCompletionRate: randInt(78, 99),
    status: i % 11 === 0 ? DriverStatus.SUSPENDED : i % 7 === 0 ? DriverStatus.OFF_DUTY : i % 4 === 0 ? DriverStatus.ON_TRIP : DriverStatus.AVAILABLE,
  }));
  await prisma.driver.createMany({ data: driverData });
  const drivers = await prisma.driver.findMany({ select: { id: true } });

  // ── Trips (~90): 55 spread over ~120d + 35 dense in last 7d ──
  const STATUS_POOL: TripStatus[] = [
    ...Array(9).fill(TripStatus.COMPLETED),
    ...Array(4).fill(TripStatus.DISPATCHED),
    ...Array(3).fill(TripStatus.DRAFT),
    ...Array(3).fill(TripStatus.CANCELLED),
  ];
  const tripData: any[] = [];
  const total = 90;
  for (let i = 0; i < total; i++) {
    const status = pick(STATUS_POOL);
    const createdAt = i < 55 ? daysAgo(randInt(7, 120)) : daysAgo(randInt(0, 6));
    const assigned = status !== TripStatus.DRAFT;
    const v = assigned ? pick(vehicles) : null;
    const d = assigned ? pick(drivers) : null;
    const distance = randInt(20, 420);
    const startOdo = v ? v.odometer + randInt(0, 500) : null;
    const src = pick(PLACES);
    let dest = pick(PLACES);
    while (dest === src) dest = pick(PLACES);

    const base: any = {
      tripCode: `TR${String(i + 1).padStart(4, '0')}`,
      source: src, destination: dest,
      cargoWeightKg: v ? randInt(100, v.capacityKg) : randInt(100, 800),
      plannedDistanceKm: distance,
      status,
      vehicleId: v?.id ?? null,
      driverId: d?.id ?? null,
      createdAt,
    };
    if (status === TripStatus.DISPATCHED) { base.dispatchedAt = createdAt; base.startOdometer = startOdo; }
    if (status === TripStatus.CANCELLED) { base.cancelledAt = createdAt; base.cancelReason = pick(['Vehicle went to shop', 'Customer cancelled', 'Driver unavailable', 'Route blocked']); }
    if (status === TripStatus.COMPLETED) {
      base.dispatchedAt = createdAt;
      base.completedAt = new Date(createdAt.getTime() + randInt(2, 30) * 3600000);
      base.startOdometer = startOdo;
      base.endOdometer = (startOdo ?? 0) + distance;
      base.revenue = Math.round(distance * randInt(30, 60) + randInt(500, 3000));
    }
    tripData.push(base);
  }
  await prisma.trip.createMany({ data: tripData });
  const trips = await prisma.trip.findMany({
    where: { status: TripStatus.COMPLETED },
    select: { id: true, vehicleId: true, endOdometer: true, completedAt: true, plannedDistanceKm: true },
  });

  // ── Fuel logs + expenses for completed trips ─────────────────
  const fuelLogs = trips.map((t) => ({
    vehicleId: t.vehicleId!,
    tripId: t.id,
    date: t.completedAt ?? new Date(),
    liters: Math.round((t.plannedDistanceKm / randInt(6, 12)) * 10) / 10,
    cost: randInt(800, 6000),
    odometer: t.endOdometer,
  }));
  await prisma.fuelLog.createMany({ data: fuelLogs });

  const expenses = trips.filter(() => chance(0.6)).map((t) => ({
    vehicleId: t.vehicleId!,
    tripId: t.id,
    category: pick([ExpenseCategory.TOLL, ExpenseCategory.MISC]),
    toll: randInt(0, 400),
    other: randInt(0, 300),
    date: t.completedAt ?? new Date(),
  }));
  await prisma.expense.createMany({ data: expenses });

  // ── Maintenance records (~12) ────────────────────────────────
  const maint = Array.from({ length: 12 }, () => {
    const v = pick(vehicles);
    return {
      vehicleId: v.id,
      serviceType: pick(SERVICES),
      cost: randInt(1500, 22000),
      serviceDate: daysAgo(randInt(0, 90)),
      status: chance(0.4) ? MaintenanceStatus.IN_SHOP : MaintenanceStatus.COMPLETED,
    };
  });
  await prisma.maintenanceRecord.createMany({ data: maint });

  const [vc, dc, tc, fc, ec, mc] = await Promise.all([
    prisma.vehicle.count(), prisma.driver.count(), prisma.trip.count(),
    prisma.fuelLog.count(), prisma.expense.count(), prisma.maintenanceRecord.count(),
  ]);
  console.log(`✅ Seed complete → vehicles:${vc} drivers:${dc} trips:${tc} fuel:${fc} expenses:${ec} maintenance:${mc}`);
  console.log('   Login with any *@transitops.in / Passw0rd!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
