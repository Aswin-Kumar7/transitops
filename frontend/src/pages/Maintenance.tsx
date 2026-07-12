import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/badge';
import type { MaintenanceRecord, Vehicle } from '@/types';
import { Wrench01Icon } from 'hugeicons-react';
import { Dropdown } from '@/components/ui/dropdown';

const cardStyles = 'bg-white rounded-[32px] shadow-sm flex flex-col min-h-0 border-none p-6 lg:p-8';
const inputStyles = 'w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all';
const primaryBtn = 'rounded-2xl bg-[#1B5E47] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#154a38] transition-colors disabled:opacity-70 disabled:cursor-not-allowed';
const outlineBtn = 'rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-gray-500 shadow-sm border border-gray-100 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed';

interface FormState { vehicleId: string; serviceType: string; cost: string; serviceDate: string; notes: string; }
const todayIso = () => new Date().toISOString().slice(0, 10);
const EMPTY_FORM: FormState = { vehicleId: '', serviceType: '', cost: '', serviceDate: todayIso(), notes: '' };

export default function Maintenance() {
  const { canWrite } = useAuth();
  const canEdit = canWrite('fleet');
  const [records, setRecords] = useState<MaintenanceRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  function fetchRecords() {
    setLoading(true); setError(null);
    api.get<MaintenanceRecord[]>('/maintenance').then(setRecords).catch((e: ApiError) => setError(e.message)).finally(() => setLoading(false));
  }
  function fetchVehicles() {
    api.get<Vehicle[]>('/vehicles').then(setVehicles).catch(() => {});
  }
  useEffect(() => { fetchRecords(); fetchVehicles(); }, []);
  const serviceableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setFormError(null); setFieldErrors({}); setSubmitting(true);
    try {
      await api.post<MaintenanceRecord>('/maintenance', { vehicleId: form.vehicleId, serviceType: form.serviceType.trim(), cost: form.cost, serviceDate: form.serviceDate, notes: form.notes.trim() || undefined });
      setForm({ ...EMPTY_FORM, serviceDate: todayIso() }); fetchRecords(); fetchVehicles();
    } catch (err) {
      if (err instanceof ApiError) { setFormError(err.message); if (err.details) setFieldErrors(err.details); }
      else { setFormError('Something went wrong. Please try again.'); }
    } finally { setSubmitting(false); }
  }

  async function closeService(record: MaintenanceRecord) {
    setRowError(null); setClosingId(record.id);
    try {
      await api.patch<MaintenanceRecord>(`/maintenance/${record.id}/close`, {});
      fetchRecords(); fetchVehicles();
    } catch (err) { setRowError(err instanceof ApiError ? err.message : 'Something went wrong.'); } 
    finally { setClosingId(null); }
  }

  return (
    <div className="font-poppins flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#1B5E47] bg-white shadow-sm">
            <Wrench01Icon size={22} strokeWidth={2.5} />
          </div>
          Maintenance
        </h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {canEdit && (
          <div className={`${cardStyles} bg-[#E5F5EF] xl:col-span-1`}>
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[#1B5E47]">Log Service Record</h2>
            {formError && <div className="mb-4 rounded-2xl border-none bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2 relative">
                <label htmlFor="vehicleId" className="text-xs font-semibold text-[#1B5E47]/70">Vehicle</label>
                <Dropdown 
                  value={form.vehicleId} 
                  onChange={(val) => setForm({ ...form, vehicleId: val })} 
                  options={[{label: 'Select a vehicle…', value: ''}, ...serviceableVehicles.map(v => ({ label: `${v.registrationNo} — ${v.name}`, value: v.id }))]} 
                  className="flex h-[46px] w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                />
                {fieldErrors.vehicleId && <p className="text-xs font-medium text-red-500">{fieldErrors.vehicleId}</p>}
                {serviceableVehicles.length === 0 && <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-2">No vehicles are currently available for service.</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="serviceType" className="text-xs font-semibold text-[#1B5E47]/70">Service Type</label>
                <input id="serviceType" className={inputStyles} placeholder="Oil Change, Engine Repair…" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} />
                {fieldErrors.serviceType && <p className="text-xs font-medium text-red-500">{fieldErrors.serviceType}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="cost" className="text-xs font-semibold text-[#1B5E47]/70">Cost</label>
                <input id="cost" type="number" min={0} step="0.01" className={inputStyles} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                {fieldErrors.cost && <p className="text-xs font-medium text-red-500">{fieldErrors.cost}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="serviceDate" className="text-xs font-semibold text-[#1B5E47]/70">Service Date</label>
                <input id="serviceDate" type="date" className={inputStyles} value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} />
                {fieldErrors.serviceDate && <p className="text-xs font-medium text-red-500">{fieldErrors.serviceDate}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-xs font-semibold text-[#1B5E47]/70">Notes (optional)</label>
                <textarea id="notes" rows={3} className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <button type="submit" className={`w-full mt-4 ${primaryBtn}`} disabled={submitting}>{submitting ? 'Saving…' : 'Log Service'}</button>
            </form>
          </div>
        )}

        <div className={`${cardStyles} p-0 ${canEdit ? 'xl:col-span-2' : 'xl:col-span-3'} flex flex-col overflow-hidden`}>
          <div className="p-6 pb-4 shrink-0">
            <h2 className="text-lg font-semibold text-black">Service Log</h2>
          </div>
          {rowError && <div className="mx-6 mb-4 rounded-2xl border-none bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm shrink-0">{rowError}</div>}
          
          <div className="flex-1 overflow-auto px-6 pb-6 space-y-4">
            {loading ? <p className="text-sm font-medium text-gray-500">Loading service records…</p> : !loading && error ? <p className="text-sm font-semibold text-red-500">{error}</p> : !loading && !error && records && records.length === 0 ? <p className="text-sm font-medium text-gray-500">No service records yet.</p> : (
              records?.map((r) => (
                <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 transition-colors shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-black flex items-center gap-2">
                        {r.vehicle.registrationNo} <span className="font-medium text-gray-400 text-sm">— {r.vehicle.name}</span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {r.serviceType} · {formatCurrency(r.cost)} · {new Date(r.serviceDate).toLocaleDateString()}
                      </p>
                      {r.notes && <p className="mt-2 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded-xl">Notes: {r.notes}</p>}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  {canEdit && r.status === 'IN_SHOP' && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
                      <button className={outlineBtn} disabled={closingId === r.id} onClick={() => closeService(r)}>
                        {closingId === r.id ? 'Closing…' : 'Close Service'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
