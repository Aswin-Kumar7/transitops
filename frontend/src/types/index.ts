export type Role = 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
export type Module = 'fleet' | 'drivers' | 'trips' | 'fuel' | 'analytics' | 'settings';
export type Access = 'none' | 'view' | 'full';

export type Permissions = Record<Module, Access>;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
  permissions: Permissions;
}

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

// ── Fleet (Member 1) ──────────────────────────────────────────────

export type VehicleType = 'VAN' | 'TRUCK' | 'MINI';
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export interface Vehicle {
  id: string;
  registrationNo: string;
  name: string;
  type: VehicleType;
  capacityKg: number;
  odometer: number;
  acquisitionCost: string; // Prisma Decimal -> JSON string
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceStatus = 'IN_SHOP' | 'COMPLETED';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicle: { name: string; registrationNo: string };
  serviceType: string;
  cost: string; // Prisma Decimal -> JSON string
  serviceDate: string;
  status: MaintenanceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Drivers (Member 2) ────────────────────────────────────────────

export type LicenseCategory = 'LMV' | 'HMV';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  licenseCategory: LicenseCategory;
  licenseExpiry: string;
  contact: string;
  tripCompletionRate: string | number; // Prisma Decimal -> JSON string
  status: DriverStatus;
  // Derived flags — present on GET /drivers, omitted on trip options.
  assignable?: boolean;
  licenseExpired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Trips (Member 2) ──────────────────────────────────────────────

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

// Trimmed shapes returned inside the trip board (see trips boardInclude).
export interface TripVehicleRef {
  id: string;
  name: string;
  registrationNo: string;
  capacityKg: number;
  odometer: number;
  status: VehicleStatus;
}
export interface TripDriverRef {
  id: string;
  name: string;
  licenseNo: string;
  status: DriverStatus;
  licenseExpiry: string;
}

export interface Trip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: TripStatus;
  startOdometer: number | null;
  endOdometer: number | null;
  revenue: string | number | null; // Prisma Decimal -> JSON string
  cancelReason: string | null;
  vehicle: TripVehicleRef | null;
  driver: TripDriverRef | null;
}

// GET /trips/options — full vehicle/driver records for the create-trip form.
export interface TripOptions {
  vehicles: Vehicle[];
  drivers: Driver[];
}
