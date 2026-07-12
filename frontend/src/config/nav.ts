import { LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings, type LucideIcon } from 'lucide-react';
import type { Module } from '@/types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Module this nav item belongs to. null => always visible (dashboard). */
  module: Module | null;
}

// Sidebar order matches the wireframe.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, module: null },
  { label: 'Fleet', path: '/fleet', icon: Truck, module: 'fleet' },
  { label: 'Drivers', path: '/drivers', icon: Users, module: 'drivers' },
  { label: 'Trips', path: '/trips', icon: Route, module: 'trips' },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, module: 'fleet' },
  { label: 'Fuel & Expenses', path: '/fuel', icon: Fuel, module: 'fuel' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, module: 'analytics' },
  { label: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
];
