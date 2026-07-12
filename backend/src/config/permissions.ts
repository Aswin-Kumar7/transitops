import { Role } from '@prisma/client';

/**
 * RBAC matrix — mirrors the "Role-Based Access" table on the Settings screen.
 *
 * Modules map to feature areas. Access level:
 *   'none'  -> hidden / 403
 *   'view'  -> read-only (GET allowed, writes 403)
 *   'full'  -> read + write
 *
 * This is the single source of truth for the backend. The frontend keeps a
 * matching copy in src/config/rbac.ts for nav + UI gating; keep them in sync.
 */

export type Module = 'fleet' | 'drivers' | 'trips' | 'fuel' | 'analytics' | 'settings';
export type Access = 'none' | 'view' | 'full';

export const PERMISSIONS: Record<Role, Record<Module, Access>> = {
  FLEET_MANAGER: {
    fleet: 'full',
    drivers: 'full',
    trips: 'none',
    fuel: 'none',
    analytics: 'full',
    settings: 'full',
  },
  DISPATCHER: {
    fleet: 'view',
    drivers: 'none',
    trips: 'full',
    fuel: 'none',
    analytics: 'none',
    settings: 'none',
  },
  SAFETY_OFFICER: {
    fleet: 'none',
    drivers: 'full',
    trips: 'view',
    fuel: 'none',
    analytics: 'none',
    settings: 'none',
  },
  FINANCIAL_ANALYST: {
    fleet: 'view',
    drivers: 'none',
    trips: 'none',
    fuel: 'full',
    analytics: 'full',
    settings: 'none',
  },
};

export const canRead = (role: Role, module: Module): boolean =>
  PERMISSIONS[role][module] !== 'none';

export const canWrite = (role: Role, module: Module): boolean =>
  PERMISSIONS[role][module] === 'full';
