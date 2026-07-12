import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import type { Expense, ExpenseCategory, FuelLog, FuelSummary, MaintenanceRecord, Vehicle } from '@/types';
import { Wallet01Icon } from 'hugeicons-react';
import { Dropdown } from '@/components/ui/dropdown';

const todayIso = () => new Date().toISOString().slice(0, 10);
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['TOLL', 'MISC', 'FUEL', 'MAINTENANCE'];

interface FuelForm { vehicleId: string; date: string; liters: string; cost: string; odometer: string; }
interface ExpenseForm { vehicleId: string; category: ExpenseCategory; toll: string; other: string; note: string; }
const emptyFuel: FuelForm = { vehicleId: '', date: todayIso(), liters: '', cost: '', odometer: '' };
const emptyExpense: ExpenseForm = { vehicleId: '', category: 'TOLL', toll: '', other: '', note: '' };

const cardStyles = 'bg-white rounded-[32px] shadow-sm flex flex-col min-h-0 border-none p-6 lg:p-8';
const inputStyles = 'w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all';
const primaryBtn = 'rounded-2xl bg-[#1B5E47] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#154a38] transition-colors disabled:opacity-70 disabled:cursor-not-allowed';

export default function Fuel() {
  const { canWrite } = useAuth();
  const canEdit = canWrite('fuel');
  const [logs, setLogs] = useState<FuelLog[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [summary, setSummary] = useState<FuelSummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintByVehicle, setMaintByVehicle] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [fuelForm, setFuelForm] = useState<FuelForm>(emptyFuel);
  const [fuelErr, setFuelErr] = useState<{ message: string | null; fields: Record<string, string> }>({ message: null, fields: {} });
  const [savingFuel, setSavingFuel] = useState(false);
  const [expForm, setExpForm] = useState<ExpenseForm>(emptyExpense);
  const [expErr, setExpErr] = useState<{ message: string | null; fields: Record<string, string> }>({ message: null, fields: {} });
  const [savingExp, setSavingExp] = useState(false);

  function load() {
    Promise.all([api.get<FuelLog[]>('/fuel/logs'), api.get<Expense[]>('/fuel/expenses'), api.get<FuelSummary>('/fuel/summary')])
      .then(([l, e, s]) => { setLogs(l); setExpenses(e); setSummary(s); setError(null); })
      .catch((err: ApiError) => setError(err.message));
    api.get<Vehicle[]>('/vehicles').then(setVehicles).catch(() => setVehicles([]));
    api.get<MaintenanceRecord[]>('/maintenance').then((recs) => {
        const map: Record<string, number> = {};
        for (const r of recs) map[r.vehicleId] = (map[r.vehicleId] ?? 0) + Number(r.cost);
        setMaintByVehicle(map);
      }).catch(() => setMaintByVehicle({}));
  }
  useEffect(load, []);

  async function submitFuel(e: FormEvent) {
    e.preventDefault(); setSavingFuel(true); setFuelErr({ message: null, fields: {} });
    try {
      await api.post('/fuel/logs', { vehicleId: fuelForm.vehicleId, date: fuelForm.date, liters: fuelForm.liters, cost: fuelForm.cost, ...(fuelForm.odometer ? { odometer: fuelForm.odometer } : {}), });
      setFuelForm({ ...emptyFuel, date: todayIso() }); load();
    } catch (err) {
      if (err instanceof ApiError) setFuelErr({ message: err.message, fields: err.details ?? {} });
      else setFuelErr({ message: 'Something went wrong.', fields: {} });
    } finally { setSavingFuel(false); }
  }

  async function submitExpense(e: FormEvent) {
    e.preventDefault(); setSavingExp(true); setExpErr({ message: null, fields: {} });
    try {
      await api.post('/fuel/expenses', { vehicleId: expForm.vehicleId, category: expForm.category, toll: expForm.toll || 0, other: expForm.other || 0, ...(expForm.note.trim() ? { note: expForm.note.trim() } : {}), });
      setExpForm(emptyExpense); load();
    } catch (err) {
      if (err instanceof ApiError) setExpErr({ message: err.message, fields: err.details ?? {} });
      else setExpErr({ message: 'Something went wrong.', fields: {} });
    } finally { setSavingExp(false); }
  }

  return (
    <div className="font-poppins flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#1B5E47] bg-white shadow-sm">
            <Wallet01Icon size={22} strokeWidth={2.5} />
          </div>
          Fuel &amp; Expenses
        </h1>
        {summary && (
          <div className="rounded-[24px] bg-white shadow-sm px-6 py-4 flex flex-col items-end border-none">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Op Cost (Fuel + Maint)</div>
            <div className="text-2xl font-semibold text-[#1B5E47]">{formatCurrency(summary.totalOperationalCost)}</div>
          </div>
        )}
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-sm">{error}</p>}

      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Fuel Cost', value: summary.fuelCost },
            { label: 'Maintenance Cost', value: summary.maintenanceCost },
            { label: 'Toll', value: summary.tollTotal },
            { label: 'Other', value: summary.otherTotal },
          ].map((k) => (
            <div key={k.label} className="rounded-[24px] bg-white shadow-sm p-6 border-none">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold text-black">{formatCurrency(k.value)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fuel logs */}
        <div className={`${cardStyles} p-0 overflow-hidden flex flex-col`}>
          <div className="p-6 pb-4 shrink-0">
            <h2 className="text-lg font-semibold text-black">Fuel Logs</h2>
          </div>
          <div className="flex-1 overflow-auto px-6 pb-6 space-y-4">
            {canEdit && (
              <form onSubmit={submitFuel} className="grid gap-4 rounded-[24px] bg-gray-50 border border-gray-100 p-6 sm:grid-cols-2 mb-6" noValidate>
                <div className="sm:col-span-2 text-sm font-semibold text-black">Log Fuel</div>
                {fuelErr.message && <p className="sm:col-span-2 text-xs font-semibold text-red-500">{fuelErr.message}</p>}
                <div className="space-y-2 relative">
                  <label htmlFor="f-vehicle" className="text-xs font-semibold text-gray-600">Vehicle</label>
                  <Dropdown 
                    value={fuelForm.vehicleId} 
                    onChange={(val) => setFuelForm({ ...fuelForm, vehicleId: val })} 
                    options={[{label: 'Select vehicle…', value: ''}, ...vehicles.map(v => ({ label: `${v.registrationNo} — ${v.name}`, value: v.id }))]} 
                    className="flex h-[46px] w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                  />
                  {fuelErr.fields.vehicleId && <p className="text-xs font-medium text-red-500">{fuelErr.fields.vehicleId}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="f-date" className="text-xs font-semibold text-gray-600">Date</label>
                  <input id="f-date" type="date" className={inputStyles} value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="f-liters" className="text-xs font-semibold text-gray-600">Litres</label>
                  <input id="f-liters" type="number" min="0.1" step="0.01" className={inputStyles} value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
                  {fuelErr.fields.liters && <p className="text-xs font-medium text-red-500">{fuelErr.fields.liters}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="f-cost" className="text-xs font-semibold text-gray-600">Cost</label>
                  <input id="f-cost" type="number" min="0" step="0.01" className={inputStyles} value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
                  {fuelErr.fields.cost && <p className="text-xs font-medium text-red-500">{fuelErr.fields.cost}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="f-odo" className="text-xs font-semibold text-gray-600">Odometer (optional)</label>
                  <input id="f-odo" type="number" min="0" className={inputStyles} value={fuelForm.odometer} onChange={(e) => setFuelForm({ ...fuelForm, odometer: e.target.value })} />
                </div>
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" className={primaryBtn} disabled={savingFuel}>{savingFuel ? 'Saving…' : '+ Log Fuel'}</button>
                </div>
              </form>
            )}

            {!logs ? <p className="text-sm font-medium text-gray-500">Loading…</p> : logs.length === 0 ? <p className="text-sm font-medium text-gray-500">No fuel logs yet.</p> : (
              logs.map((l) => (
                <div key={l.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-black">{l.vehicle.name}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">{new Date(l.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-black">{formatCurrency(l.cost)}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">{Number(l.liters)} L</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className={`${cardStyles} p-0 overflow-hidden flex flex-col`}>
          <div className="p-6 pb-4 shrink-0">
            <h2 className="text-lg font-semibold text-black">Other Expenses (Toll / Misc)</h2>
          </div>
          <div className="flex-1 overflow-auto px-6 pb-6 space-y-4">
            {canEdit && (
              <form onSubmit={submitExpense} className="grid gap-4 rounded-[24px] bg-gray-50 border border-gray-100 p-6 sm:grid-cols-2 mb-6" noValidate>
                <div className="sm:col-span-2 text-sm font-semibold text-black">Add Expense</div>
                {expErr.message && <p className="sm:col-span-2 text-xs font-semibold text-red-500">{expErr.message}</p>}
                <div className="space-y-2 relative">
                  <label htmlFor="e-vehicle" className="text-xs font-semibold text-gray-600">Vehicle</label>
                  <Dropdown 
                    value={expForm.vehicleId} 
                    onChange={(val) => setExpForm({ ...expForm, vehicleId: val })} 
                    options={[{label: 'Select vehicle…', value: ''}, ...vehicles.map(v => ({ label: `${v.registrationNo} — ${v.name}`, value: v.id }))]} 
                    className="flex h-[46px] w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                  />
                  {expErr.fields.vehicleId && <p className="text-xs font-medium text-red-500">{expErr.fields.vehicleId}</p>}
                </div>
                <div className="space-y-2 relative">
                  <label htmlFor="e-cat" className="text-xs font-semibold text-gray-600">Category</label>
                  <Dropdown 
                    value={expForm.category} 
                    onChange={(val) => setExpForm({ ...expForm, category: val as ExpenseCategory })} 
                    options={EXPENSE_CATEGORIES.map(c => ({ label: c, value: c }))} 
                    className="flex h-[46px] w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="e-toll" className="text-xs font-semibold text-gray-600">Toll</label>
                  <input id="e-toll" type="number" min="0" step="0.01" className={inputStyles} value={expForm.toll} onChange={(e) => setExpForm({ ...expForm, toll: e.target.value })} />
                  {expErr.fields.toll && <p className="text-xs font-medium text-red-500">{expErr.fields.toll}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="e-other" className="text-xs font-semibold text-gray-600">Other</label>
                  <input id="e-other" type="number" min="0" step="0.01" className={inputStyles} value={expForm.other} onChange={(e) => setExpForm({ ...expForm, other: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="e-note" className="text-xs font-semibold text-gray-600">Note (optional)</label>
                  <input id="e-note" className={inputStyles} value={expForm.note} onChange={(e) => setExpForm({ ...expForm, note: e.target.value })} />
                </div>
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" className={primaryBtn} disabled={savingExp}>{savingExp ? 'Saving…' : '+ Add Expense'}</button>
                </div>
              </form>
            )}

            {!expenses ? <p className="text-sm font-medium text-gray-500">Loading…</p> : expenses.length === 0 ? <p className="text-sm font-medium text-gray-500">No expenses recorded yet.</p> : (
              expenses.map((x) => {
                const maint = maintByVehicle[x.vehicleId] ?? 0;
                return (
                  <div key={x.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-black">{x.vehicle.name}</div>
                      <div className="text-sm font-semibold text-[#1B5E47]">{formatCurrency(Number(x.toll) + Number(x.other) + maint)} Total</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Toll</div>
                        <div className="text-xs font-semibold text-black mt-1">{formatCurrency(x.toll)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Other</div>
                        <div className="text-xs font-semibold text-black mt-1">{formatCurrency(x.other)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Maint (Linked)</div>
                        <div className="text-xs font-semibold text-gray-500 mt-1">{formatCurrency(maint)}</div>
                      </div>
                    </div>
                    {x.trip && <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1B5E47] bg-[#E5F5EF] inline-block px-2 py-1 rounded-lg">Trip: {x.trip.tripCode}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
