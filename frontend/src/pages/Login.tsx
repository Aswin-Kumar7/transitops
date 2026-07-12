import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { ROLE_LABELS, type Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLE_SCOPE: { role: Role; scope: string }[] = [
  { role: 'FLEET_MANAGER', scope: 'Fleet, Maintenance' },
  { role: 'DISPATCHER', scope: 'Dashboard, Trips' },
  { role: 'SAFETY_OFFICER', scope: 'Drivers, Compliance' },
  { role: 'FINANCIAL_ANALYST', scope: 'Fuel & Expenses, Analytics' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('DISPATCHER');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(email.trim(), password, role);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) setFieldErrors(err.details);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden w-2/5 flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div>
          <div className="mb-4 h-14 w-14 rounded bg-primary" />
          <h1 className="text-3xl font-bold">TransitOps</h1>
          <p className="mt-1 text-slate-400">Smart Transport Operations Platform</p>
        </div>
        <div>
          <p className="mb-4 font-medium">One login, four roles:</p>
          <ul className="space-y-2 text-slate-300">
            {ROLE_SCOPE.map(({ role: r }) => (
              <li key={r} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {ROLE_LABELS[r]}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs uppercase tracking-widest text-slate-500">TransitOps © 2026 · RBAC enabled</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5" noValidate>
          <div>
            <h2 className="text-2xl font-semibold">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              ✕ {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@transitops.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Role (RBAC)</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ROLE_SCOPE.map(({ role: r }) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>

          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p className="mb-2">Access is scoped by role after login:</p>
            <ul className="space-y-1">
              {ROLE_SCOPE.map(({ role: r, scope }) => (
                <li key={r}>
                  • {ROLE_LABELS[r]} → {scope}
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
