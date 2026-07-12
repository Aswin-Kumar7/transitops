import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { Expense, ExpenseCategory, FuelLog, FuelSummary, Vehicle } from '@/types';

const todayIso = () => new Date().toISOString().slice(0, 10);
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['TOLL', 'MISC', 'FUEL', 'MAINTENANCE'];

interface FuelForm {
  vehicleId: string;
  date: string;
  liters: string;
  cost: string;
  odometer: string;
}
interface ExpenseForm {
  vehicleId: string;
  category: ExpenseCategory;
  toll: string;
  other: string;
  note: string;
}

const emptyFuel: FuelForm = { vehicleId: '', date: todayIso(), liters: '', cost: '', odometer: '' };
const emptyExpense: ExpenseForm = { vehicleId: '', category: 'TOLL', toll: '', other: '', note: '' };

export default function Fuel() {
  const { canWrite } = useAuth();
  const canEdit = canWrite('fuel');

  const [logs, setLogs] = useState<FuelLog[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [summary, setSummary] = useState<FuelSummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [fuelForm, setFuelForm] = useState<FuelForm>(emptyFuel);
  const [fuelErr, setFuelErr] = useState<{ message: string | null; fields: Record<string, string> }>({ message: null, fields: {} });
  const [savingFuel, setSavingFuel] = useState(false);

  const [expForm, setExpForm] = useState<ExpenseForm>(emptyExpense);
  const [expErr, setExpErr] = useState<{ message: string | null; fields: Record<string, string> }>({ message: null, fields: {} });
  const [savingExp, setSavingExp] = useState(false);

  function load() {
    Promise.all([
      api.get<FuelLog[]>('/fuel/logs'),
      api.get<Expense[]>('/fuel/expenses'),
      api.get<FuelSummary>('/fuel/summary'),
    ])
      .then(([l, e, s]) => {
        setLogs(l);
        setExpenses(e);
        setSummary(s);
        setError(null);
      })
      .catch((err: ApiError) => setError(err.message));
    // Vehicles power the pickers (Financial Analyst has fleet: view).
    api.get<Vehicle[]>('/vehicles').then(setVehicles).catch(() => setVehicles([]));
  }

  useEffect(load, []);

  async function submitFuel(e: FormEvent) {
    e.preventDefault();
    setSavingFuel(true);
    setFuelErr({ message: null, fields: {} });
    try {
      await api.post('/fuel/logs', {
        vehicleId: fuelForm.vehicleId,
        date: fuelForm.date,
        liters: fuelForm.liters,
        cost: fuelForm.cost,
        ...(fuelForm.odometer ? { odometer: fuelForm.odometer } : {}),
      });
      setFuelForm({ ...emptyFuel, date: todayIso() });
      load();
    } catch (err) {
      if (err instanceof ApiError) setFuelErr({ message: err.message, fields: err.details ?? {} });
      else setFuelErr({ message: 'Something went wrong.', fields: {} });
    } finally {
      setSavingFuel(false);
    }
  }

  async function submitExpense(e: FormEvent) {
    e.preventDefault();
    setSavingExp(true);
    setExpErr({ message: null, fields: {} });
    try {
      await api.post('/fuel/expenses', {
        vehicleId: expForm.vehicleId,
        category: expForm.category,
        toll: expForm.toll || 0,
        other: expForm.other || 0,
        ...(expForm.note.trim() ? { note: expForm.note.trim() } : {}),
      });
      setExpForm(emptyExpense);
      load();
    } catch (err) {
      if (err instanceof ApiError) setExpErr({ message: err.message, fields: err.details ?? {} });
      else setExpErr({ message: 'Something went wrong.', fields: {} });
    } finally {
      setSavingExp(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Fuel &amp; Expenses</h1>
        {summary && (
          <div className="rounded-lg border bg-card px-5 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Operational Cost (Fuel + Maintenance)</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(summary.totalOperationalCost)}</div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Fuel Cost', value: summary.fuelCost },
            { label: 'Maintenance Cost', value: summary.maintenanceCost },
            { label: 'Toll', value: summary.tollTotal },
            { label: 'Other', value: summary.otherTotal },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
                <div className="mt-1 text-xl font-semibold">{formatCurrency(k.value)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fuel logs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Fuel Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit && (
              <form onSubmit={submitFuel} className="grid gap-3 rounded-md border p-4 sm:grid-cols-2" noValidate>
                <div className="sm:col-span-2 text-sm font-medium">Log Fuel</div>
                {fuelErr.message && <p className="sm:col-span-2 text-xs text-destructive">{fuelErr.message}</p>}
                <div className="space-y-1">
                  <Label htmlFor="f-vehicle">Vehicle</Label>
                  <Select id="f-vehicle" required value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
                    <option value="" disabled>Select vehicle…</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo} — {v.name}</option>)}
                  </Select>
                  {fuelErr.fields.vehicleId && <p className="text-xs text-destructive">{fuelErr.fields.vehicleId}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-date">Date</Label>
                  <Input id="f-date" type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-liters">Litres</Label>
                  <Input id="f-liters" type="number" min="0.1" step="0.01" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
                  {fuelErr.fields.liters && <p className="text-xs text-destructive">{fuelErr.fields.liters}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-cost">Cost</Label>
                  <Input id="f-cost" type="number" min="0" step="0.01" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
                  {fuelErr.fields.cost && <p className="text-xs text-destructive">{fuelErr.fields.cost}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="f-odo">Odometer (optional)</Label>
                  <Input id="f-odo" type="number" min="0" value={fuelForm.odometer} onChange={(e) => setFuelForm({ ...fuelForm, odometer: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={savingFuel}>{savingFuel ? 'Saving…' : '+ Log Fuel'}</Button>
                </div>
              </form>
            )}

            {!logs ? <p className="text-sm text-muted-foreground">Loading…</p> : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fuel logs yet.</p>
            ) : (
              <Table>
                <THead><TR><TH>Vehicle</TH><TH>Date</TH><TH>Litres</TH><TH>Cost</TH></TR></THead>
                <TBody>
                  {logs.map((l) => (
                    <TR key={l.id}>
                      <TD className="font-medium">{l.vehicle.name}</TD>
                      <TD>{new Date(l.date).toLocaleDateString()}</TD>
                      <TD>{Number(l.liters)} L</TD>
                      <TD>{formatCurrency(l.cost)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader><CardTitle>Other Expenses (Toll / Misc)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {canEdit && (
              <form onSubmit={submitExpense} className="grid gap-3 rounded-md border p-4 sm:grid-cols-2" noValidate>
                <div className="sm:col-span-2 text-sm font-medium">Add Expense</div>
                {expErr.message && <p className="sm:col-span-2 text-xs text-destructive">{expErr.message}</p>}
                <div className="space-y-1">
                  <Label htmlFor="e-vehicle">Vehicle</Label>
                  <Select id="e-vehicle" required value={expForm.vehicleId} onChange={(e) => setExpForm({ ...expForm, vehicleId: e.target.value })}>
                    <option value="" disabled>Select vehicle…</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo} — {v.name}</option>)}
                  </Select>
                  {expErr.fields.vehicleId && <p className="text-xs text-destructive">{expErr.fields.vehicleId}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="e-cat">Category</Label>
                  <Select id="e-cat" value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value as ExpenseCategory })}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="e-toll">Toll</Label>
                  <Input id="e-toll" type="number" min="0" step="0.01" value={expForm.toll} onChange={(e) => setExpForm({ ...expForm, toll: e.target.value })} />
                  {expErr.fields.toll && <p className="text-xs text-destructive">{expErr.fields.toll}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="e-other">Other</Label>
                  <Input id="e-other" type="number" min="0" step="0.01" value={expForm.other} onChange={(e) => setExpForm({ ...expForm, other: e.target.value })} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="e-note">Note (optional)</Label>
                  <Input id="e-note" value={expForm.note} onChange={(e) => setExpForm({ ...expForm, note: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={savingExp}>{savingExp ? 'Saving…' : '+ Add Expense'}</Button>
                </div>
              </form>
            )}

            {!expenses ? <p className="text-sm text-muted-foreground">Loading…</p> : expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
            ) : (
              <Table>
                <THead><TR><TH>Vehicle</TH><TH>Trip</TH><TH>Toll</TH><TH>Other</TH><TH>Total</TH></TR></THead>
                <TBody>
                  {expenses.map((x) => (
                    <TR key={x.id}>
                      <TD className="font-medium">{x.vehicle.name}</TD>
                      <TD>{x.trip?.tripCode ?? '—'}</TD>
                      <TD>{formatCurrency(x.toll)}</TD>
                      <TD>{formatCurrency(x.other)}</TD>
                      <TD>{formatCurrency(Number(x.toll) + Number(x.other))}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
