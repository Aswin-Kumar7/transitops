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
