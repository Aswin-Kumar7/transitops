import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ROLE_LABELS, type Access, type Module, type Role, type SettingsResponse } from '@/types';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const DISTANCE_UNITS = ['Kilometers', 'Miles'];

// Columns shown in the RBAC matrix (matches the Settings wireframe).
const MATRIX_MODULES: { key: Module; label: string }[] = [
  { key: 'fleet', label: 'Fleet' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'trips', label: 'Trips' },
  { key: 'fuel', label: 'Fuel/Exp.' },
  { key: 'analytics', label: 'Analytics' },
];
const ROLE_ORDER: Role[] = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];

const accessCell = (a: Access) => (a === 'full' ? '✓' : a === 'view' ? 'view' : '—');

export default function Settings() {
  const { canWrite } = useAuth();
  const canEdit = canWrite('settings');

  const [data, setData] = useState<SettingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ depotName: '', currency: 'INR', distanceUnit: 'Kilometers' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formMsg, setFormMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<SettingsResponse>('/settings')
      .then((res) => {
        setData(res);
        setForm({ depotName: res.general.depotName, currency: res.general.currency, distanceUnit: res.general.distanceUnit });
      })
      .catch((e: ApiError) => setError(e.message));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormMsg(null);
    try {
      const res = await api.put<SettingsResponse>('/settings', form);
      setData(res);
      setFormMsg({ kind: 'ok', text: 'Settings saved.' });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormMsg({ kind: 'err', text: err.message });
        setFieldErrors(err.details ?? {});
      } else setFormMsg({ kind: 'err', text: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading settings…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings &amp; RBAC</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="depotName">Depot Name</Label>
                <Input id="depotName" value={form.depotName} disabled={!canEdit} onChange={(e) => setForm({ ...form, depotName: e.target.value })} aria-invalid={!!fieldErrors.depotName} />
                {fieldErrors.depotName && <p className="text-xs text-destructive">{fieldErrors.depotName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Select id="currency" value={form.currency} disabled={!canEdit} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="distanceUnit">Distance Unit</Label>
                <Select id="distanceUnit" value={form.distanceUnit} disabled={!canEdit} onChange={(e) => setForm({ ...form, distanceUnit: e.target.value })}>
                  {DISTANCE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </Select>
              </div>
              {formMsg && <p className={`text-sm ${formMsg.kind === 'ok' ? 'text-status-available' : 'text-destructive'}`}>{formMsg.text}</p>}
              {canEdit ? (
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
              ) : (
                <p className="text-xs text-muted-foreground">Only Fleet Managers can edit depot settings.</p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Role-Based Access (RBAC)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4">Role</th>
                    {MATRIX_MODULES.map((m) => <th key={m.key} className="py-2 pr-4">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ROLE_ORDER.map((role) => (
                    <tr key={role} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{ROLE_LABELS[role]}</td>
                      {MATRIX_MODULES.map((m) => {
                        const a = data.rbac[role][m.key];
                        return (
                          <td key={m.key} className={`py-2 pr-4 ${a === 'full' ? 'text-status-available' : a === 'view' ? 'text-status-ontrip' : 'text-muted-foreground'}`}>
                            {accessCell(a)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Read-only — mirrors the server's permission matrix.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
