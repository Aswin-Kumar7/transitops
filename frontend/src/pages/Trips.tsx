import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckmarkCircle02Icon, CancelCircleIcon, Route01Icon } from 'hugeicons-react';
import { Dropdown } from '@/components/ui/dropdown';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/ui/badge';
import type { Trip, TripOptions, TripStatus } from '@/types';

interface TripForm { source: string; destination: string; cargoWeightKg: string; plannedDistanceKm: string; vehicleId: string; driverId: string; }

const emptyForm: TripForm = { source: '', destination: '', cargoWeightKg: '', plannedDistanceKm: '', vehicleId: '', driverId: '' };
const steps: { status: TripStatus; label: string; icon: typeof Route01Icon }[] = [
  { status: 'DRAFT', label: 'Draft', icon: Route01Icon }, { status: 'DISPATCHED', label: 'Dispatched', icon: Route01Icon },
  { status: 'COMPLETED', label: 'Completed', icon: CheckmarkCircle02Icon }, { status: 'CANCELLED', label: 'Cancelled', icon: CancelCircleIcon },
];

const cardStyles = 'bg-white rounded-[32px] shadow-sm flex flex-col border-none p-8';
const inputStyles = 'w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all';
const primaryBtn = 'rounded-2xl bg-[#1B5E47] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#154a38] transition-colors disabled:opacity-70 disabled:cursor-not-allowed';
const outlineBtn = 'rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-gray-500 shadow-sm border border-gray-100 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-70';
const destructiveBtn = 'rounded-2xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2';

export default function Trips() {
  const { canWrite } = useAuth();
  const writable = canWrite('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [options, setOptions] = useState<TripOptions>({ vehicles: [], drivers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<Trip | null>(null);
  const [cancelling, setCancelling] = useState<Trip | null>(null);
  
  const [endOdometer, setEndOdometer] = useState('');
  const [revenue, setRevenue] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [expenseToll, setExpenseToll] = useState('');
  const [expenseOther, setExpenseOther] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const resetComplete = () => {
    setCompleting(null); setEndOdometer(''); setRevenue('');
    setFuelLiters(''); setFuelCost(''); setExpenseToll(''); setExpenseOther('');
  };

  const load = async () => {
    setLoading(true);
    try {
      const [nextTrips, nextOptions] = await Promise.all([api.get<Trip[]>('/trips'), api.get<TripOptions>('/trips/options')]);
      setTrips(nextTrips); setOptions(nextOptions); setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load trip dispatcher');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const selectedVehicle = useMemo(() => options.vehicles.find((vehicle) => vehicle.id === form.vehicleId), [options.vehicles, form.vehicleId]);
  const cargo = Number(form.cargoWeightKg || 0);
  const capacityBlocked = Boolean(selectedVehicle && cargo > selectedVehicle.capacityKg);
  const capacityDelta = selectedVehicle ? Math.max(0, cargo - selectedVehicle.capacityKg) : 0;
  const setField = (key: keyof TripForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const validation = (key: string) => fieldErrors[key] && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors[key]}</p>;

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setFormError(null); setFieldErrors({});
    try {
      await api.post<Trip>('/trips', form);
      setForm(emptyForm);
      await load();
    } catch (err) {
      if (err instanceof ApiError) { setFormError(err.message); setFieldErrors(err.details ?? {}); }
      else setFormError('Could not create the trip draft');
    } finally { setSaving(false); }
  };

  const dispatch = async (trip: Trip) => {
    try { await api.patch<Trip>(`/trips/${trip.id}/dispatch`, {}); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not dispatch trip'); }
  };
  const complete = async (event: FormEvent) => {
    event.preventDefault();
    if (!completing) return;
    try {
      await api.patch<Trip>(`/trips/${completing.id}/complete`, {
        endOdometer,
        ...(revenue ? { revenue } : {}),
        ...(fuelLiters ? { fuelLiters, fuelCost: fuelCost || 0 } : {}),
        ...(expenseToll ? { expenseToll } : {}),
        ...(expenseOther ? { expenseOther } : {}),
      });
      resetComplete(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not complete trip'); }
  };
  const cancel = async (event: FormEvent) => {
    event.preventDefault();
    if (!cancelling) return;
    try {
      await api.patch<Trip>(`/trips/${cancelling.id}/cancel`, { cancelReason });
      setCancelling(null); setCancelReason(''); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not cancel trip'); }
  };

  return (
    <div className="font-poppins flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#1B5E47] bg-white shadow-sm">
              <Route01Icon size={22} strokeWidth={2.5} />
            </div>
            Trip Dispatcher
          </h1>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Plan safely, dispatch live, and capture final odometers.</p>
        </div>
      </div>

      {error && <p className="rounded-2xl border-none bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-sm">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <div className={cardStyles}>
            <h2 className="mb-6 text-base font-semibold text-black">Trip Lifecycle</h2>
            <ol className="space-y-4">
              {steps.map(({ status, label, icon: Icon }, index) => (
                <li key={status} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#1B5E47]">
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-black">{index + 1}. {label}</span>
                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                      {status === 'DRAFT' ? 'Plan route and assignment' : status === 'DISPATCHED' ? 'Vehicle and driver are held' : status === 'COMPLETED' ? 'Odometer captured and resources released' : 'Reason recorded and resources released'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {writable && (
            <div className={`${cardStyles} bg-[#E5F5EF]`}>
              <h2 className="mb-6 text-base font-semibold text-[#1B5E47]">Create a Trip Draft</h2>
              <form className="space-y-4" onSubmit={create} noValidate>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="source" className="text-xs font-semibold text-[#1B5E47]/70">Source</label>
                    <input id="source" className={inputStyles} value={form.source} onChange={(e) => setField('source', e.target.value)} />
                    {validation('source')}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="destination" className="text-xs font-semibold text-[#1B5E47]/70">Destination</label>
                    <input id="destination" className={inputStyles} value={form.destination} onChange={(e) => setField('destination', e.target.value)} />
                    {validation('destination')}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="cargo" className="text-xs font-semibold text-[#1B5E47]/70">Cargo weight (kg)</label>
                    <input id="cargo" type="number" min="1" className={inputStyles} value={form.cargoWeightKg} onChange={(e) => setField('cargoWeightKg', e.target.value)} />
                    {validation('cargoWeightKg')}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="distance" className="text-xs font-semibold text-[#1B5E47]/70">Planned distance (km)</label>
                    <input id="distance" type="number" min="1" className={inputStyles} value={form.plannedDistanceKm} onChange={(e) => setField('plannedDistanceKm', e.target.value)} />
                    {validation('plannedDistanceKm')}
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label htmlFor="vehicle" className="text-xs font-semibold text-[#1B5E47]/70">Vehicle (available only)</label>
                  <Dropdown 
                    value={form.vehicleId} 
                    onChange={(val) => setField('vehicleId', val)} 
                    options={[{label: 'Select vehicle', value: ''}, ...options.vehicles.map(v => ({ label: `${v.name} · ${v.registrationNo} · ${v.capacityKg} kg`, value: v.id }))]} 
                    className="flex h-12 w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                  />
                  {validation('vehicleId')}
                </div>

                <div className="space-y-2 relative">
                  <label htmlFor="driver" className="text-xs font-semibold text-[#1B5E47]/70">Driver (eligible only)</label>
                  <Dropdown 
                    value={form.driverId} 
                    onChange={(val) => setField('driverId', val)} 
                    options={[{label: 'Select driver', value: ''}, ...options.drivers.map(d => ({ label: `${d.name} · ${d.licenseNo}`, value: d.id }))]} 
                    className="flex h-12 w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                  />
                  {validation('driverId')}
                </div>

                <div className={`rounded-2xl p-4 text-sm mt-4 ${capacityBlocked ? 'bg-red-50 text-red-600' : 'bg-white text-[#1B5E47]'}`}>
                  <div className="font-semibold mb-1">{capacityBlocked ? 'Capacity Warning' : 'Capacity Check'}</div>
                  {selectedVehicle ? <p className="text-xs font-medium">{cargo || 0} kg cargo / {selectedVehicle.capacityKg} kg vehicle capacity {capacityBlocked ? `— exceeded by ${capacityDelta} kg` : '— within limit'}</p> : <p className="text-xs font-medium opacity-70">Select a vehicle to check capacity.</p>}
                </div>

                {formError && <p className="text-sm font-semibold text-red-500 mt-2">{formError}</p>}
                <button type="submit" disabled={saving} className={`w-full mt-4 ${primaryBtn}`}>
                  {saving ? 'Creating…' : 'Create Draft'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className={`xl:col-span-3 ${cardStyles} p-0 flex flex-col`}>
          <div className="p-8 pb-4 shrink-0">
            <h2 className="text-lg font-semibold text-black">Live Board</h2>
          </div>
          <div className="flex-1 overflow-auto px-8 pb-8 space-y-4">
            {loading ? <p className="font-medium text-gray-500 text-sm">Loading trips…</p> : trips.length === 0 ? <p className="font-medium text-gray-500 text-sm">No trips have been planned yet.</p> : trips.map((trip) => {
              const overCapacity = Boolean(trip.vehicle && trip.cargoWeightKg > trip.vehicle.capacityKg);
              return (
                <div key={trip.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 transition-colors shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-black flex items-center gap-2">
                        {trip.tripCode} <span className="font-medium text-gray-400 text-sm">{trip.source} → {trip.destination}</span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {trip.cargoWeightKg} kg · {trip.plannedDistanceKm} km · {trip.vehicle?.name ?? 'Vehicle pending'} · {trip.driver?.name ?? 'Driver pending'}
                      </p>
                      {trip.status === 'CANCELLED' && trip.cancelReason && <p className="mt-2 text-xs font-semibold text-red-500">Cancelled: {trip.cancelReason}</p>}
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>
                  {writable && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-3">
                      {trip.status === 'DRAFT' && <button className={primaryBtn} onClick={() => void dispatch(trip)} disabled={overCapacity || !trip.vehicle || !trip.driver}>Dispatch</button>}
                      {trip.status === 'DISPATCHED' && <><button className={primaryBtn} onClick={() => { resetComplete(); setCompleting(trip); }}>Complete</button><button className={outlineBtn} onClick={() => { setCancelling(trip); setCancelReason(''); }}>Cancel</button></>}
                      {trip.status === 'DRAFT' && <button className={outlineBtn} onClick={() => { setCancelling(trip); setCancelReason(''); }}>Cancel</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="px-8 py-6 border-t border-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-400 shrink-0">
            On complete: odometer → fuel log → expenses → vehicle and driver available.
          </p>
        </div>
      </div>

      {completing && (
        <div className={`${cardStyles} bg-gray-50`}>
          <h2 className="mb-6 text-lg font-semibold text-black">Complete {completing.tripCode}</h2>
          <form className="space-y-6" onSubmit={complete}>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label htmlFor="end-odometer" className="text-xs font-semibold text-gray-600">End odometer (start: {completing.startOdometer ?? '—'})</label>
                <input id="end-odometer" required type="number" min={completing.startOdometer ?? 0} className={inputStyles} value={endOdometer} onChange={(e) => setEndOdometer(e.target.value)} />
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label htmlFor="revenue" className="text-xs font-semibold text-gray-600">Revenue (optional)</label>
                <input id="revenue" type="number" min="0" className={inputStyles} value={revenue} onChange={(e) => setRevenue(e.target.value)} />
              </div>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Fuel &amp; expenses (optional — logged against this trip)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label htmlFor="c-liters" className="text-xs font-semibold text-gray-600">Fuel litres</label>
                  <input id="c-liters" type="number" min="0" step="0.01" className={inputStyles} value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="c-fcost" className="text-xs font-semibold text-gray-600">Fuel cost</label>
                  <input id="c-fcost" type="number" min="0" step="0.01" className={inputStyles} value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="c-toll" className="text-xs font-semibold text-gray-600">Toll</label>
                  <input id="c-toll" type="number" min="0" step="0.01" className={inputStyles} value={expenseToll} onChange={(e) => setExpenseToll(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="c-other" className="text-xs font-semibold text-gray-600">Other</label>
                  <input id="c-other" type="number" min="0" step="0.01" className={inputStyles} value={expenseOther} onChange={(e) => setExpenseOther(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className={primaryBtn}>Confirm Completion</button>
              <button type="button" className={outlineBtn} onClick={resetComplete}>Close</button>
            </div>
          </form>
        </div>
      )}

      {cancelling && (
        <div className={`${cardStyles} bg-red-50`}>
          <h2 className="mb-4 text-lg font-semibold text-red-600">Cancel {cancelling.tripCode}</h2>
          <form className="flex flex-wrap items-end gap-4" onSubmit={cancel}>
            <div className="flex-1 min-w-[250px] space-y-2">
              <label htmlFor="cancel-reason" className="text-xs font-semibold text-red-700">Cancellation reason</label>
              <input id="cancel-reason" required minLength={3} className={inputStyles} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <button type="submit" className={destructiveBtn}>
              <CancelCircleIcon size={18} strokeWidth={2.5} /> Cancel Trip
            </button>
            <button type="button" className={`${outlineBtn} !border-red-200 !text-red-700 hover:!bg-red-100`} onClick={() => setCancelling(null)}>
              Close
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
