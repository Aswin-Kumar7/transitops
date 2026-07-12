import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Module } from '@/types';

/**
 * Gates a route. Requires auth; optionally requires EDIT (full) access to a module,
 * so read-only screens hidden from the nav are also unreachable by direct URL.
 * Unauthorized users are redirected (to /login or /).
 */
export function ProtectedRoute({ children, module }: { children: ReactNode; module?: Module }) {
  const { user, loading, canWrite } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (module && !canWrite(module)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
