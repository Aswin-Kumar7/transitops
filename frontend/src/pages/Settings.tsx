import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, type Module, type Role, type SettingsResponse } from '@/types';
import { Settings01Icon } from 'hugeicons-react';
import { Dropdown } from '@/components/ui/dropdown';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const DISTANCE_UNITS = ['Kilometers', 'Miles'];
const MATRIX_MODULES: { key: Module; label: string }[] = [{ key: 'fleet', label: 'Fleet' }, { key: 'drivers', label: 'Drivers' }, { key: 'trips', label: 'Trips' }, { key: 'fuel', label: 'Fuel/Exp.' }, { key: 'analytics', label: 'Analytics' }];
const ROLE_ORDER: Role[] = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];

const cardStyles = 'bg-white rounded-[32px] shadow-sm flex flex-col min-h-0 border-none p-6 lg:p-8';
const inputStyles = 'w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all';
const primaryBtn = 'rounded-2xl bg-[#1B5E47] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#154a38] transition-colors disabled:opacity-70 disabled:cursor-not-allowed';

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
    api.get<SettingsResponse>('/settings')
      .then((res) => { setData(res); setForm({ depotName: res.general.depotName, currency: res.general.currency, distanceUnit: res.general.distanceUnit }); })
      .catch((e: ApiError) => setError(e.message));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setFieldErrors({}); setFormMsg(null);
    try {
      const res = await api.put<SettingsResponse>('/settings', form);
      setData(res); setFormMsg({ kind: 'ok', text: 'Settings saved.' });
    } catch (err) {
      if (err instanceof ApiError) { setFormMsg({ kind: 'err', text: err.message }); setFieldErrors(err.details ?? {}); } 
      else setFormMsg({ kind: 'err', text: 'Something went wrong.' });
    } finally { setSaving(false); }
  }

  return (
    <div className="font-poppins flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#1B5E47] bg-white shadow-sm">
            <Settings01Icon size={22} strokeWidth={2.5} />
          </div>
          Settings &amp; RBAC
        </h1>
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-sm">{error}</p>}
      {!data && !error && <p className="text-sm font-medium text-gray-500">Loading settings…</p>}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardStyles}>
            <h2 className="mb-6 text-lg font-semibold text-black">General</h2>
            <form onSubmit={save} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label htmlFor="depotName" className="text-xs font-semibold text-gray-600">Depot Name</label>
                <input id="depotName" className={inputStyles} value={form.depotName} disabled={!canEdit} onChange={(e) => setForm({ ...form, depotName: e.target.value })} />
                {fieldErrors.depotName && <p className="text-xs font-medium text-red-500">{fieldErrors.depotName}</p>}
              </div>
              <div className="space-y-2 relative">
                <label htmlFor="currency" className="text-xs font-semibold text-gray-600">Currency</label>
                <Dropdown 
                  value={form.currency} 
                  onChange={(val) => setForm({ ...form, currency: val })} 
                  options={CURRENCIES.map(c => ({ label: c, value: c }))} 
                  disabled={!canEdit} 
                  className="flex h-11 w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                />
              </div>
              <div className="space-y-2 relative">
                <label htmlFor="distanceUnit" className="text-xs font-semibold text-gray-600">Distance Unit</label>
                <Dropdown 
                  value={form.distanceUnit} 
                  onChange={(val) => setForm({ ...form, distanceUnit: val })} 
                  options={DISTANCE_UNITS.map(u => ({ label: u, value: u }))} 
                  disabled={!canEdit} 
                  className="flex h-11 w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                />
              </div>
              {formMsg && <div className={`rounded-xl p-3 text-sm font-semibold text-center ${formMsg.kind === 'ok' ? 'bg-[#E5F5EF] text-[#1B5E47]' : 'bg-red-50 text-red-600'}`}>{formMsg.text}</div>}
              {canEdit ? <button type="submit" className={primaryBtn} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button> : <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-2">Only Fleet Managers can edit depot settings.</p>}
            </form>
          </div>

          <div className={`${cardStyles} p-0 overflow-hidden`}>
            <div className="p-8 pb-4">
              <h2 className="text-lg font-semibold text-black">Role-Based Access (RBAC)</h2>
            </div>
            <div className="overflow-x-auto px-8 pb-8">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">Role</th>
                    {MATRIX_MODULES.map((m) => <th key={m.key} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100 text-left">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ROLE_ORDER.map((role) => (
                    <tr key={role} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-black text-sm rounded-l-2xl">{ROLE_LABELS[role]}</td>
                      {MATRIX_MODULES.map((m) => {
                        const a = data.rbac[role][m.key];
                        return (
                          <td key={m.key} className={`px-4 py-3 font-semibold text-sm text-left ${m.key === 'analytics' ? 'rounded-r-2xl' : ''} ${a === 'full' ? 'text-[#1B5E47]' : a === 'view' ? 'text-black' : 'text-gray-300'}`}>
                            {a === 'full' ? 'WRITE' : a === 'view' ? 'READ' : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Read-only — mirrors the server's permission matrix.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
