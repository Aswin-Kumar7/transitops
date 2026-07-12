import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Module } from '@/types';

/**
 * Gates a route. Requires auth; optionally requires read access to a module.
 * Unauthorized users are redirected (to /login or /).
 */
export function ProtectedRoute({ children, module }: { children: ReactNode; module?: Module }) {
  const { user, loading, canRead } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (module && !canRead(module)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
