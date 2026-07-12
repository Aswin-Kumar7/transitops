import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/badge';
import type { Vehicle, VehicleStatus, VehicleType } from '@/types';
import { DeliveryTruck01Icon, Search01Icon } from 'hugeicons-react';
import { Dropdown } from '@/components/ui/dropdown';

const VEHICLE_TYPES: VehicleType[] = ['VAN', 'TRUCK', 'MINI'];
const VEHICLE_STATUSES: VehicleStatus[] = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const cardStyles = 'bg-white rounded-[32px] shadow-sm flex flex-col min-h-0 border-none p-6';
const inputStyles = 'w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all';
const pill = 'relative flex items-center gap-2 rounded-2xl border-none bg-white shadow-sm py-2.5 pl-4 pr-3 text-sm font-medium transition-shadow hover:shadow-md';
const primaryBtn = 'rounded-2xl bg-[#1B5E47] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#154a38] transition-colors disabled:opacity-70 disabled:cursor-not-allowed';
const outlineBtn = 'rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-gray-500 shadow-sm border border-gray-100 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed';

interface FormState {
  registrationNo: string;
  name: string;
  type: VehicleType;
  capacityKg: string;
  odometer: string;
  acquisitionCost: string;
  region: string;
}

const EMPTY_FORM: FormState = {
  registrationNo: '',
  name: '',
  type: 'VAN',
  capacityKg: '',
  odometer: '0',
  acquisitionCost: '',
  region: '',
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
      region: vehicle.region ?? '',
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
      ...(form.region.trim() ? { region: form.region.trim() } : {}),
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
    <div className="font-poppins h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#1B5E47] bg-white shadow-sm">
            <DeliveryTruck01Icon size={22} strokeWidth={2.5} />
          </div>
          Vehicle Registry
        </h1>
        {canEdit && (
          <button className={formOpen ? outlineBtn : primaryBtn} onClick={formOpen ? closeForm : openAddForm}>
            {formOpen ? 'Cancel' : '+ Add Vehicle'}
          </button>
        )}
      </div>

      {canEdit && formOpen && (
        <div className={`${cardStyles} shrink-0 bg-[#E5F5EF] p-8`}>
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[#1B5E47]">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            {formError && (
              <div className="mb-6 rounded-2xl border-none bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" noValidate>
              <div className="space-y-2">
                <label htmlFor="registrationNo" className="text-xs font-semibold text-gray-600">Registration No.</label>
                <input
                  id="registrationNo"
                  className={inputStyles}
                  value={form.registrationNo}
                  onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
                  placeholder="GJ01AB4521"
                />
                {fieldErrors.registrationNo && (
                  <p className="text-xs font-medium text-red-500">{fieldErrors.registrationNo}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold text-gray-600">Name / Model</label>
                <input
                  id="name"
                  className={inputStyles}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VAN-05"
                />
                {fieldErrors.name && <p className="text-xs font-medium text-red-500">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2 relative">
                <label htmlFor="type" className="text-xs font-semibold text-gray-600">Type</label>
                <Dropdown 
                  value={form.type} 
                  onChange={(val) => setForm({ ...form, type: val as VehicleType })} 
                  options={VEHICLE_TYPES.map(t => ({ label: t, value: t }))} 
                  className="flex h-11 w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                />
                {fieldErrors.type && <p className="text-xs font-medium text-red-500">{fieldErrors.type}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="capacityKg" className="text-xs font-semibold text-gray-600">Capacity (kg)</label>
                <input
                  id="capacityKg"
                  type="number"
                  className={inputStyles}
                  value={form.capacityKg}
                  onChange={(e) => setForm({ ...form, capacityKg: e.target.value })}
                />
                {fieldErrors.capacityKg && (
                  <p className="text-xs font-medium text-red-500">{fieldErrors.capacityKg}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="odometer" className="text-xs font-semibold text-gray-600">Odometer (km)</label>
                <input
                  id="odometer"
                  type="number"
                  className={inputStyles}
                  value={form.odometer}
                  onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                />
                {fieldErrors.odometer && <p className="text-xs font-medium text-red-500">{fieldErrors.odometer}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="acquisitionCost" className="text-xs font-semibold text-gray-600">Acquisition Cost</label>
                <input
                  id="acquisitionCost"
                  type="number"
                  step="0.01"
                  className={inputStyles}
                  value={form.acquisitionCost}
                  onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
                />
                {fieldErrors.acquisitionCost && (
                  <p className="text-xs font-medium text-red-500">{fieldErrors.acquisitionCost}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="region" className="text-xs font-semibold text-gray-600">Region</label>
                <input
                  id="region"
                  className={inputStyles}
                  placeholder="e.g. Gandhinagar"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                />
                {fieldErrors.region && <p className="text-xs font-medium text-red-500">{fieldErrors.region}</p>}
              </div>

              <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3 mt-4">
                <button type="submit" className={primaryBtn} disabled={submitting}>
                  {submitting ? 'Saving…' : editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
                <button type="button" className={outlineBtn} onClick={closeForm} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
        </div>
      )}

      <div className={`${cardStyles} flex-1 overflow-hidden`}>
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 mb-6 shrink-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-black bg-gray-50 shadow-sm border border-gray-100">
              <Search01Icon size={18} strokeWidth={2.5} />
            </div>
            <label className={pill}>
              <span className="text-gray-400 font-normal">Type</span>
              <Dropdown 
                value={typeFilter} 
                onChange={setTypeFilter} 
                options={[{label: 'All', value: ''}, ...VEHICLE_TYPES.map(t => ({ label: t, value: t }))]} 
                className="w-24 font-semibold text-black bg-transparent" 
              />
            </label>

            <label className={pill}>
              <span className="text-gray-400 font-normal">Status</span>
              <Dropdown 
                value={statusFilter} 
                onChange={setStatusFilter} 
                options={[{label: 'All', value: ''}, ...VEHICLE_STATUSES.map(s => ({ label: s.replace('_', ' '), value: s }))]} 
                className="w-32 font-semibold text-black bg-transparent" 
              />
            </label>

            <div className="min-w-[220px] flex-1 relative">
              <input
                placeholder="Search by registration number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl bg-white border-none px-4 py-2.5 text-sm font-medium text-black shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
              />
            </div>
          </div>

          <p className="text-xs font-medium text-gray-400 mb-6 shrink-0 uppercase tracking-wider">
            Registration No. must be unique · Retired/In-Shop hidden from Dispatch
          </p>

          {rowError && (
            <div className="mb-6 rounded-2xl border-none bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm shrink-0">
              {rowError}
            </div>
          )}

          {loading && <p className="text-sm font-normal text-gray-500">Loading vehicles…</p>}
          {!loading && error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          {!loading && !error && vehicles && vehicles.length === 0 && (
            <p className="text-sm font-normal text-gray-500 py-8 text-center">{emptyMessage}</p>
          )}

          {/* Data Table */}
          {!loading && !error && vehicles && vehicles.length > 0 && (
             <div className="flex-1 overflow-auto px-2 -mx-2">
               <table className="w-full text-left">
                 <thead className="sticky top-0 bg-white z-10">
                   <tr>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Reg No</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Name / Model</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Type</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Capacity</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Odometer</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Acq. Cost</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Status</th>
                     {canEdit && <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 text-right">Actions</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {vehicles.map((v) => {
                      const statusActionable = v.status === 'AVAILABLE' || v.status === 'RETIRED';
                      return (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 text-sm font-semibold text-black">{v.registrationNo}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{v.name}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{v.type}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{v.capacityKg.toLocaleString()} kg</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{v.odometer.toLocaleString()} km</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{formatCurrency(v.acquisitionCost)}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={v.status} />
                          </td>
                          {canEdit && (
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex justify-end gap-2">
                                <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-white shadow-sm border border-gray-100 hover:text-black hover:bg-gray-50 transition-colors" onClick={() => openEditForm(v)}>
                                  Edit
                                </button>
                                <button
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-white shadow-sm border border-gray-100 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-50"
                                  disabled={!statusActionable || statusActionId === v.id}
                                  onClick={() => toggleRetire(v)}
                                >
                                  {statusActionId === v.id ? 'Saving…' : v.status === 'RETIRED' ? 'Activate' : 'Retire'}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
             </div>
          )}
      </div>
    </div>
  );
}
