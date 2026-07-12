import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, CircleOff, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import type { Trip, TripOptions, TripStatus } from '@/types';

interface TripForm { source: string; destination: string; cargoWeightKg: string; plannedDistanceKm: string; vehicleId: string; driverId: string; }

const emptyForm: TripForm = { source: '', destination: '', cargoWeightKg: '', plannedDistanceKm: '', vehicleId: '', driverId: '' };
const steps: { status: TripStatus; label: string; icon: typeof Circle }[] = [
  { status: 'DRAFT', label: 'Draft', icon: Circle }, { status: 'DISPATCHED', label: 'Dispatched', icon: Circle },
  { status: 'COMPLETED', label: 'Completed', icon: CheckCircle2 }, { status: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

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
  const validation = (key: string) => fieldErrors[key] && <p className="mt-1 text-xs text-destructive">{fieldErrors[key]}</p>;

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
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Trip Dispatcher</h1><p className="mt-1 text-sm text-muted-foreground">Plan safely, dispatch live, and capture the final odometer on completion.</p></div>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <Card><CardHeader><CardTitle>Trip lifecycle</CardTitle></CardHeader><CardContent><ol className="space-y-4">{steps.map(({ status, label, icon: Icon }, index) => <li key={status} className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><div><span className="font-medium">{index + 1}. {label}</span><p className="text-xs text-muted-foreground">{status === 'DRAFT' ? 'Plan route and assignment' : status === 'DISPATCHED' ? 'Vehicle and driver are held' : status === 'COMPLETED' ? 'Odometer captured and resources released' : 'Reason recorded and resources released'}</p></div></li>)}</ol></CardContent></Card>
          {writable && <Card><CardHeader><CardTitle>Create a trip draft</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={create}>
            <div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="source">Source</Label><Input id="source" value={form.source} onChange={(e) => setField('source', e.target.value)} />{validation('source')}</div><div><Label htmlFor="destination">Destination</Label><Input id="destination" value={form.destination} onChange={(e) => setField('destination', e.target.value)} />{validation('destination')}</div></div>
            <div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="cargo">Cargo weight (kg)</Label><Input id="cargo" type="number" min="1" value={form.cargoWeightKg} onChange={(e) => setField('cargoWeightKg', e.target.value)} />{validation('cargoWeightKg')}</div><div><Label htmlFor="distance">Planned distance (km)</Label><Input id="distance" type="number" min="1" value={form.plannedDistanceKm} onChange={(e) => setField('plannedDistanceKm', e.target.value)} />{validation('plannedDistanceKm')}</div></div>
            <div><Label htmlFor="vehicle">Vehicle (available only)</Label><Select id="vehicle" required value={form.vehicleId} onChange={(e) => setField('vehicleId', e.target.value)}><option value="">Select vehicle</option>{options.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.registrationNo} · {vehicle.capacityKg} kg</option>)}</Select>{validation('vehicleId')}</div>
            <div><Label htmlFor="driver">Driver (eligible only)</Label><Select id="driver" required value={form.driverId} onChange={(e) => setField('driverId', e.target.value)}><option value="">Select driver</option>{options.drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} · {driver.licenseNo}</option>)}</Select>{validation('driverId')}</div>
            <div className={`rounded-md border p-3 text-sm ${capacityBlocked ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-status-available/30 bg-status-available/5'}`}><div className="font-medium">Capacity check</div>{selectedVehicle ? <p className="mt-1">{cargo || 0} kg cargo / {selectedVehicle.capacityKg} kg vehicle capacity {capacityBlocked ? `— exceeded by ${capacityDelta} kg` : '— within limit'}</p> : <p className="mt-1 text-muted-foreground">Select a vehicle to check capacity.</p>}</div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}<Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Draft'}</Button>
          </form></CardContent></Card>}
        </div>
        <Card className="xl:col-span-3"><CardHeader><CardTitle>Live board</CardTitle></CardHeader><CardContent className="space-y-3">{loading ? <p className="text-muted-foreground">Loading trips…</p> : trips.length === 0 ? <p className="text-muted-foreground">No trips have been planned yet.</p> : trips.map((trip) => {
          const overCapacity = Boolean(trip.vehicle && trip.cargoWeightKg > trip.vehicle.capacityKg);
          return <div key={trip.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{trip.tripCode} <span className="font-normal text-muted-foreground">{trip.source} → {trip.destination}</span></div><p className="mt-1 text-sm text-muted-foreground">{trip.cargoWeightKg} kg · {trip.plannedDistanceKm} km · {trip.vehicle?.name ?? 'Vehicle pending'} · {trip.driver?.name ?? 'Driver pending'}</p>{trip.status === 'CANCELLED' && trip.cancelReason && <p className="mt-1 text-xs text-muted-foreground">Cancelled: {trip.cancelReason}</p>}</div><StatusBadge status={trip.status} /></div>
            {writable && <div className="mt-3 flex flex-wrap gap-2">{trip.status === 'DRAFT' && <Button size="sm" onClick={() => void dispatch(trip)} disabled={overCapacity || !trip.vehicle || !trip.driver}>Dispatch</Button>}{trip.status === 'DISPATCHED' && <><Button size="sm" onClick={() => { resetComplete(); setCompleting(trip); }}>Complete</Button><Button size="sm" variant="outline" onClick={() => { setCancelling(trip); setCancelReason(''); }}>Cancel</Button></>}{trip.status === 'DRAFT' && <Button size="sm" variant="outline" onClick={() => { setCancelling(trip); setCancelReason(''); }}>Cancel</Button>}</div>}</div>;
        })}<p className="border-t pt-4 text-xs text-muted-foreground">On complete: odometer → fuel log → expenses → vehicle and driver available.</p></CardContent></Card>
      </div>
      {completing && <Card><CardHeader><CardTitle>Complete {completing.tripCode}</CardTitle></CardHeader><CardContent>
        <form className="space-y-4" onSubmit={complete}>
          <div className="flex flex-wrap items-end gap-4">
            <div><Label htmlFor="end-odometer">End odometer (start: {completing.startOdometer ?? '—'})</Label><Input id="end-odometer" required type="number" min={completing.startOdometer ?? 0} value={endOdometer} onChange={(e) => setEndOdometer(e.target.value)} /></div>
            <div><Label htmlFor="revenue">Revenue (optional)</Label><Input id="revenue" type="number" min="0" value={revenue} onChange={(e) => setRevenue(e.target.value)} /></div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fuel &amp; expenses (optional — logged against this trip)</p>
            <div className="flex flex-wrap items-end gap-4">
              <div><Label htmlFor="c-liters">Fuel litres</Label><Input id="c-liters" type="number" min="0" step="0.01" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} /></div>
              <div><Label htmlFor="c-fcost">Fuel cost</Label><Input id="c-fcost" type="number" min="0" step="0.01" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} /></div>
              <div><Label htmlFor="c-toll">Toll</Label><Input id="c-toll" type="number" min="0" step="0.01" value={expenseToll} onChange={(e) => setExpenseToll(e.target.value)} /></div>
              <div><Label htmlFor="c-other">Other</Label><Input id="c-other" type="number" min="0" step="0.01" value={expenseOther} onChange={(e) => setExpenseOther(e.target.value)} /></div>
            </div>
          </div>
          <div className="flex gap-2"><Button type="submit">Confirm Completion</Button><Button type="button" variant="outline" onClick={resetComplete}>Close</Button></div>
        </form>
      </CardContent></Card>}
      {cancelling && <Card><CardHeader><CardTitle>Cancel {cancelling.tripCode}</CardTitle></CardHeader><CardContent><form className="flex flex-wrap items-end gap-4" onSubmit={cancel}><div className="min-w-72 flex-1"><Label htmlFor="cancel-reason">Cancellation reason</Label><Input id="cancel-reason" required minLength={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} /></div><Button type="submit" variant="destructive"><CircleOff className="h-4 w-4" /> Cancel Trip</Button><Button type="button" variant="outline" onClick={() => setCancelling(null)}>Close</Button></form></CardContent></Card>}
    </div>
  );
}
