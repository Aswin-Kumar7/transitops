import { FormEvent, useEffect, useState } from 'react';
import { Alert02Icon, PencilEdit01Icon, PlusSignIcon, UserGroupIcon } from 'hugeicons-react';
import { Dropdown } from '@/components/ui/dropdown';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/ui/badge';
import type { Driver, DriverStatus } from '@/types';

interface DriverForm {
  name: string;
  licenseNo: string;
  licenseCategory: 'LMV' | 'HMV';
  licenseExpiry: string;
  contact: string;
  tripCompletionRate: string;
}

const emptyForm: DriverForm = {
  name: '', licenseNo: '', licenseCategory: 'LMV', licenseExpiry: '', contact: '', tripCompletionRate: '0',
};

const dateInput = (value: string) => value.slice(0, 10);

const cardStyles = 'bg-white rounded-[32px] shadow-sm flex flex-col min-h-0 border-none p-6';
const inputStyles = 'w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all';
const primaryBtn = 'rounded-2xl bg-[#1B5E47] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#154a38] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2';
const outlineBtn = 'rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-gray-500 shadow-sm border border-gray-100 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2';

export default function Drivers() {
  const { canWrite } = useAuth();
  const writable = canWrite('drivers');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setDrivers(await api.get<Driver[]>('/drivers'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const beginEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({
      name: driver.name, licenseNo: driver.licenseNo, licenseCategory: driver.licenseCategory,
      licenseExpiry: dateInput(driver.licenseExpiry), contact: driver.contact,
      tripCompletionRate: String(driver.tripCompletionRate),
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      if (editing) await api.put<Driver>(`/drivers/${editing.id}`, form);
      else await api.post<Driver>('/drivers', form);
      resetForm();
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        setFieldErrors(err.details ?? {});
      } else setFormError('Could not save the driver');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (driver: Driver, status: DriverStatus) => {
    try {
      await api.patch<Driver>(`/drivers/${driver.id}/status`, { status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update driver status');
    }
  };

  const field = (key: keyof DriverForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="font-poppins h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#1B5E47] bg-white shadow-sm">
              <UserGroupIcon size={22} strokeWidth={2.5} />
            </div>
            Drivers &amp; Safety
          </h1>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Expired licenses and suspended drivers cannot be assigned to trips.</p>
        </div>
        {writable && (
          <button className={formOpen ? outlineBtn : primaryBtn} onClick={formOpen ? resetForm : () => setFormOpen(true)}>
            {formOpen ? 'Cancel' : <><PlusSignIcon size={18} strokeWidth={2.5} /> Add Driver</>}
          </button>
        )}
      </div>

      {writable && formOpen && (
        <div className={`${cardStyles} shrink-0 bg-[#E5F5EF] p-8`}>
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[#1B5E47]">
              {editing ? `Edit ${editing.name}` : 'Add Driver'}
            </h2>
            <form className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" onSubmit={submit} noValidate>
              <div className="space-y-2">
                <label htmlFor="driver-name" className="text-xs font-semibold text-gray-600">Driver name</label>
                <input id="driver-name" className={inputStyles} value={form.name} onChange={(e) => field('name', e.target.value)} />
                {fieldErrors.name && <p className="text-xs font-medium text-red-500">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="license-no" className="text-xs font-semibold text-gray-600">License number</label>
                <input id="license-no" className={inputStyles} value={form.licenseNo} onChange={(e) => field('licenseNo', e.target.value)} />
                {fieldErrors.licenseNo && <p className="text-xs font-medium text-red-500">{fieldErrors.licenseNo}</p>}
              </div>
              <div className="space-y-2 relative">
                <label htmlFor="license-category" className="text-xs font-semibold text-gray-600">Category</label>
                <Dropdown 
                  value={form.licenseCategory} 
                  onChange={(val) => field('licenseCategory', val)} 
                  options={[{label: 'LMV', value: 'LMV'}, {label: 'HMV', value: 'HMV'}]} 
                  className="flex h-11 w-full rounded-2xl border-none bg-gray-50 px-4 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
                />
                {fieldErrors.licenseCategory && <p className="text-xs font-medium text-red-500">{fieldErrors.licenseCategory}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="license-expiry" className="text-xs font-semibold text-gray-600">License expiry</label>
                <input id="license-expiry" type="date" className={inputStyles} value={form.licenseExpiry} onChange={(e) => field('licenseExpiry', e.target.value)} />
                {fieldErrors.licenseExpiry && <p className="text-xs font-medium text-red-500">{fieldErrors.licenseExpiry}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="contact" className="text-xs font-semibold text-gray-600">Contact</label>
                <input id="contact" className={inputStyles} value={form.contact} onChange={(e) => field('contact', e.target.value)} />
                {fieldErrors.contact && <p className="text-xs font-medium text-red-500">{fieldErrors.contact}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="completion-rate" className="text-xs font-semibold text-gray-600">Trip completion rate (%)</label>
                <input id="completion-rate" type="number" min="0" max="100" className={inputStyles} value={form.tripCompletionRate} onChange={(e) => field('tripCompletionRate', e.target.value)} />
                {fieldErrors.tripCompletionRate && <p className="text-xs font-medium text-red-500">{fieldErrors.tripCompletionRate}</p>}
              </div>
              
              {formError && <div className="md:col-span-2 xl:col-span-3 rounded-2xl border-none bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm">{formError}</div>}
              
              <div className="flex items-end gap-3 md:col-span-2 xl:col-span-3 mt-4">
                <button type="submit" className={primaryBtn} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Driver'}</button>
                {editing && <button type="button" className={outlineBtn} onClick={resetForm}>Cancel</button>}
              </div>
            </form>
        </div>
      )}

      <div className={`${cardStyles} flex-1 overflow-hidden p-0`}>
          {loading ? <p className="p-8 font-medium text-gray-500 text-sm">Loading drivers…</p> : error ? <p className="p-8 font-semibold text-red-500 text-sm">{error}</p> : drivers.length === 0 ? <p className="p-8 font-medium text-gray-500 text-sm text-center">No drivers have been added yet.</p> : (
            <div className="flex-1 overflow-auto px-4 py-2">
               <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead className="sticky top-0 bg-white z-10">
                   <tr>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Driver</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">License</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Expiry</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Completion</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Safety</th>
                     <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                     {writable && <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>}
                   </tr>
                 </thead>
                 <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 rounded-l-2xl">
                          <div className="text-sm font-semibold text-black">{driver.name}</div>
                          <div className="text-[10px] font-semibold text-gray-400">{driver.licenseCategory}</div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-600">{driver.licenseNo}</td>
                        <td className={`px-5 py-4 text-sm font-medium ${driver.licenseExpired ? 'text-red-600' : 'text-gray-600'}`}>
                          {driver.licenseExpired && <Alert02Icon size={14} className="inline mr-1 -mt-0.5 text-red-600" />}
                          {dateInput(driver.licenseExpiry)}
                          {driver.licenseExpired && <div className="text-[10px] font-semibold uppercase mt-0.5">EXPIRED</div>}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-600">{driver.contact}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-black">{Number(driver.tripCompletionRate)}%</td>
                        <td className="px-5 py-4">
                          {driver.assignable ? <span className="text-[10px] font-semibold tracking-wider text-[#1B5E47] uppercase">Clear</span> : <span className="text-[10px] font-semibold tracking-wider text-red-600 uppercase">Blocked</span>}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={driver.status} />
                        </td>
                        {writable && (
                          <td className="px-5 py-4 rounded-r-2xl text-right">
                            <div className="flex justify-end gap-2 items-center">
                              <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-white shadow-sm border border-gray-100 hover:text-black hover:bg-gray-50 transition-colors flex items-center gap-1" onClick={() => beginEdit(driver)}>
                                <PencilEdit01Icon size={14} strokeWidth={2.5} /> Edit
                              </button>
                              {driver.status !== 'ON_TRIP' && (
                                <Dropdown 
                                  value={driver.status} 
                                  onChange={(val) => void setStatus(driver, val as DriverStatus)} 
                                  options={[{label: 'Available', value: 'AVAILABLE'}, {label: 'Off Duty', value: 'OFF_DUTY'}, {label: 'Suspended', value: 'SUSPENDED'}]} 
                                  className="w-[120px] px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-white shadow-sm border border-gray-100 outline-none"
                                />
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          )}
      </div>
    </div>
  );
}
