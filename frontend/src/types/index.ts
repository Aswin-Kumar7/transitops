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
