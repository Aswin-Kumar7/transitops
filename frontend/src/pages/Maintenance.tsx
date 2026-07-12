import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MaintenanceRecord, Vehicle } from '@/types';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface FormState {
  vehicleId: string;
  serviceType: string;
  cost: string;
  serviceDate: string;
  notes: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: FormState = {
  vehicleId: '',
  serviceType: '',
  cost: '',
  serviceDate: todayIso(),
  notes: '',
};

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
    setLoading(true);
    setError(null);
    api
      .get<MaintenanceRecord[]>('/maintenance')
      .then(setRecords)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function fetchVehicles() {
    api
      .get<Vehicle[]>('/vehicles')
      .then(setVehicles)
      .catch(() => {
        /* the log table still works without the picker list; form will just show no options */
      });
  }

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, []);

  // Only vehicles that can legally be sent for service — server re-validates regardless.
  const serviceableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await api.post<MaintenanceRecord>('/maintenance', {
        vehicleId: form.vehicleId,
        serviceType: form.serviceType.trim(),
        cost: form.cost,
        serviceDate: form.serviceDate,
        notes: form.notes.trim() || undefined,
      });
      setForm({ ...EMPTY_FORM, serviceDate: todayIso() });
      fetchRecords();
      fetchVehicles();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.details) setFieldErrors(err.details);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function closeService(record: MaintenanceRecord) {
    setRowError(null);
    setClosingId(record.id);
    try {
      await api.patch<MaintenanceRecord>(`/maintenance/${record.id}/close`, {});
      fetchRecords();
      fetchVehicles();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setClosingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Maintenance</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {canEdit && (
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Log Service Record
              </h2>

              {formError && (
                <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="vehicleId">Vehicle</Label>
                  <select
                    id="vehicleId"
                    required
                    className={selectClass}
                    value={form.vehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                    aria-invalid={!!fieldErrors.vehicleId}
                  >
                    <option value="" disabled>
                      Select a vehicle…
                    </option>
                    {serviceableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNo} — {v.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.vehicleId && (
                    <p className="text-xs text-destructive">{fieldErrors.vehicleId}</p>
                  )}
                  {serviceableVehicles.length === 0 && (
                    <p className="text-xs text-muted-foreground">No vehicles are currently available for service.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Input
                    id="serviceType"
                    placeholder="Oil Change, Engine Repair…"
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    aria-invalid={!!fieldErrors.serviceType}
                  />
                  {fieldErrors.serviceType && (
                    <p className="text-xs text-destructive">{fieldErrors.serviceType}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    aria-invalid={!!fieldErrors.cost}
                  />
                  {fieldErrors.cost && <p className="text-xs text-destructive">{fieldErrors.cost}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="serviceDate">Service Date</Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={form.serviceDate}
                    onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                    aria-invalid={!!fieldErrors.serviceDate}
                  />
                  {fieldErrors.serviceDate && (
                    <p className="text-xs text-destructive">{fieldErrors.serviceDate}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Log Service'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={canEdit ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Service Log</h2>

            {rowError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {rowError}
              </div>
            )}

            {loading && <p className="text-sm text-muted-foreground">Loading service records…</p>}
            {!loading && error && <p className="text-sm text-destructive">{error}</p>}
            {!loading && !error && records && records.length === 0 && (
              <p className="text-sm text-muted-foreground">No service records yet.</p>
            )}

            {!loading && !error && records && records.length > 0 && (
              <Table>
                <THead>
                  <TR>
                    <TH>Vehicle</TH>
                    <TH>Service Type</TH>
                    <TH>Cost</TH>
                    <TH>Date</TH>
                    <TH>Status</TH>
                    <TH>Notes</TH>
                    {canEdit && <TH>Actions</TH>}
                  </TR>
                </THead>
                <TBody>
                  {records.map((r) => (
                    <TR key={r.id}>
                      <TD className="font-medium">
                        {r.vehicle.registrationNo} — {r.vehicle.name}
                      </TD>
                      <TD>{r.serviceType}</TD>
                      <TD>{formatCurrency(r.cost)}</TD>
                      <TD>{new Date(r.serviceDate).toLocaleDateString()}</TD>
                      <TD>
                        <StatusBadge status={r.status} />
                      </TD>
                      <TD className="max-w-xs truncate text-muted-foreground">{r.notes ?? '—'}</TD>
                      {canEdit && (
                        <TD>
                          {r.status === 'IN_SHOP' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={closingId === r.id}
                              onClick={() => closeService(r)}
                            >
                              {closingId === r.id ? 'Closing…' : 'Close Service'}
                            </Button>
                          )}
                        </TD>
                      )}
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
