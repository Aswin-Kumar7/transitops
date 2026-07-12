import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Vehicle, VehicleStatus, VehicleType } from '@/types';

const VEHICLE_TYPES: VehicleType[] = ['VAN', 'TRUCK', 'MINI'];
const VEHICLE_STATUSES: VehicleStatus[] = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface FormState {
  registrationNo: string;
  name: string;
  type: VehicleType;
  capacityKg: string;
  odometer: string;
  acquisitionCost: string;
}

const EMPTY_FORM: FormState = {
  registrationNo: '',
  name: '',
  type: 'VAN',
  capacityKg: '',
  odometer: '0',
  acquisitionCost: '',
};

export default function Fleet() {
  const { canWrite } = useAuth();
  const canEdit = canWrite('fleet');

  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [statusActionId, setStatusActionId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  function fetchVehicles() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    const qs = params.toString();
    api
      .get<Vehicle[]>(`/vehicles${qs ? `?${qs}` : ''}`)
      .then(setVehicles)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, search]);

  function openAddForm() {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEditForm(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setForm({
      registrationNo: vehicle.registrationNo,
      name: vehicle.name,
      type: vehicle.type,
      capacityKg: String(vehicle.capacityKg),
      odometer: String(vehicle.odometer),
      acquisitionCost: String(Number(vehicle.acquisitionCost)),
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingVehicle(null);
    setFormError(null);
    setFieldErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    const body = {
      registrationNo: form.registrationNo.trim(),
      name: form.name.trim(),
      type: form.type,
      capacityKg: form.capacityKg,
      odometer: form.odometer,
      acquisitionCost: form.acquisitionCost,
    };
    try {
      if (editingVehicle) {
        await api.put<Vehicle>(`/vehicles/${editingVehicle.id}`, body);
      } else {
        await api.post<Vehicle>('/vehicles', body);
      }
      closeForm();
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

  async function toggleRetire(vehicle: Vehicle) {
    const nextStatus: VehicleStatus = vehicle.status === 'RETIRED' ? 'AVAILABLE' : 'RETIRED';
    setRowError(null);
    setStatusActionId(vehicle.id);
    try {
      await api.patch<Vehicle>(`/vehicles/${vehicle.id}/status`, { status: nextStatus });
      fetchVehicles();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setStatusActionId(null);
    }
  }

  const emptyMessage =
    typeFilter || statusFilter || search
      ? 'No vehicles match your filters.'
      : 'No vehicles yet. Add your first vehicle to get started.';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vehicle Registry</h1>
        {canEdit && (
          <Button onClick={formOpen ? closeForm : openAddForm}>
            {formOpen ? 'Cancel' : '+ Add Vehicle'}
          </Button>
        )}
      </div>

      {canEdit && formOpen && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </h2>
            {formError && (
              <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="registrationNo">Registration No.</Label>
                <Input
                  id="registrationNo"
                  value={form.registrationNo}
                  onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
                  aria-invalid={!!fieldErrors.registrationNo}
                  placeholder="GJ01AB4521"
                />
                {fieldErrors.registrationNo && (
                  <p className="text-xs text-destructive">{fieldErrors.registrationNo}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Name / Model</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  aria-invalid={!!fieldErrors.name}
                  placeholder="VAN-05"
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className={selectClass}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {fieldErrors.type && <p className="text-xs text-destructive">{fieldErrors.type}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="capacityKg">Capacity (kg)</Label>
                <Input
                  id="capacityKg"
                  type="number"
                  min={1}
                  value={form.capacityKg}
                  onChange={(e) => setForm({ ...form, capacityKg: e.target.value })}
                  aria-invalid={!!fieldErrors.capacityKg}
                />
                {fieldErrors.capacityKg && (
                  <p className="text-xs text-destructive">{fieldErrors.capacityKg}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="odometer">Odometer (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  min={0}
                  value={form.odometer}
                  onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  aria-invalid={!!fieldErrors.odometer}
                />
                {fieldErrors.odometer && <p className="text-xs text-destructive">{fieldErrors.odometer}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
                <Input
                  id="acquisitionCost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.acquisitionCost}
                  onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
                  aria-invalid={!!fieldErrors.acquisitionCost}
                />
                {fieldErrors.acquisitionCost && (
                  <p className="text-xs text-destructive">{fieldErrors.acquisitionCost}</p>
                )}
              </div>

              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="filterType">Type</Label>
              <select
                id="filterType"
                className={cn(selectClass, 'w-40')}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filterStatus">Status</Label>
              <select
                id="filterStatus"
                className={cn(selectClass, 'w-40')}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[220px] flex-1 space-y-1.5">
              <Label htmlFor="search">Search Reg. No.</Label>
              <Input
                id="search"
                placeholder="Search by registration number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Registration No. must be unique · Retired/In-Shop vehicles are hidden from Trip Dispatcher.
          </p>

          {rowError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {rowError}
            </div>
          )}

          {loading && <p className="text-sm text-muted-foreground">Loading vehicles…</p>}
          {!loading && error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && vehicles && vehicles.length === 0 && (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          )}

          {!loading && !error && vehicles && vehicles.length > 0 && (
            <Table>
              <THead>
                <TR>
                  <TH>Reg No</TH>
                  <TH>Name / Model</TH>
                  <TH>Type</TH>
                  <TH>Capacity</TH>
                  <TH>Odometer</TH>
                  <TH>Acq. Cost</TH>
                  <TH>Status</TH>
                  {canEdit && <TH>Actions</TH>}
                </TR>
              </THead>
              <TBody>
                {vehicles.map((v) => {
                  const statusActionable = v.status === 'AVAILABLE' || v.status === 'RETIRED';
                  return (
                    <TR key={v.id}>
                      <TD className="font-medium">{v.registrationNo}</TD>
                      <TD>{v.name}</TD>
                      <TD>{v.type}</TD>
                      <TD>{v.capacityKg.toLocaleString()} kg</TD>
                      <TD>{v.odometer.toLocaleString()} km</TD>
                      <TD>{formatCurrency(v.acquisitionCost)}</TD>
                      <TD>
                        <StatusBadge status={v.status} />
                      </TD>
                      {canEdit && (
                        <TD>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditForm(v)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!statusActionable || statusActionId === v.id}
                              onClick={() => toggleRetire(v)}
                              title={
                                statusActionable
                                  ? undefined
                                  : 'Status is managed by Trips/Maintenance while ON_TRIP/IN_SHOP'
                              }
                            >
                              {statusActionId === v.id
                                ? 'Saving…'
                                : v.status === 'RETIRED'
                                  ? 'Activate'
                                  : 'Retire'}
                            </Button>
                          </div>
                        </TD>
                      )}
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
