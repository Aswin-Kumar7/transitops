import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardCircleIcon } from 'hugeicons-react';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { ROLE_LABELS, type Role } from '@/types';

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
    <div className="flex min-h-screen bg-[#F1F3F6] font-poppins text-[#111]">
      {/* Left brand panel */}
      <div className="hidden w-2/5 flex-col justify-between bg-[#1B5E47] p-12 text-white lg:flex relative overflow-hidden rounded-r-[48px] shadow-2xl z-10">
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="mb-6 h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
            <DashboardCircleIcon size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">TransitOps</h1>
          <p className="mt-2 text-white/70 font-normal">Smart Transport Operations Platform</p>
        </div>
        <div className="relative z-10">
          <p className="mb-4 font-medium opacity-90">One login, four roles:</p>
          <ul className="space-y-3 text-white/80 font-normal text-sm">
            {ROLE_SCOPE.map(({ role: r }) => (
              <li key={r} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                {ROLE_LABELS[r]}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs font-medium uppercase tracking-widest text-white/50 relative z-10">TransitOps © 2026 · RBAC enabled</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <h2 className="text-2xl font-semibold text-black">Sign In</h2>
              <p className="text-sm font-normal text-gray-400 mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="rounded-2xl border-none bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@transitops.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
              />
              {fieldErrors.email && <p className="text-xs font-medium text-red-500">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
              />
              {fieldErrors.password && <p className="text-xs font-medium text-red-500">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-semibold text-gray-700">Role (RBAC)</label>
              <Dropdown 
                value={role} 
                onChange={(val) => setRole(val as Role)} 
                options={ROLE_SCOPE.map(({ role: r }) => ({ label: ROLE_LABELS[r], value: r }))} 
                className="flex h-[46px] w-full rounded-2xl bg-gray-50 border-none px-4 text-sm font-semibold text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
              />
            </div>

            <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-[#1B5E47] py-3 text-sm font-semibold text-white shadow-md hover:bg-[#154a38] transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="border-t border-gray-100 pt-6 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              <p className="mb-3 text-gray-500">Access is scoped by role after login:</p>
              <ul className="space-y-2">
                {ROLE_SCOPE.map(({ role: r, scope }) => (
                  <li key={r} className="flex justify-between">
                    <span className="text-black">{ROLE_LABELS[r]}</span>
                    <span>{scope}</span>
                  </li>
                ))}
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
