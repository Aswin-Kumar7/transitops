import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Pencil, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  licenseCategory: 'LMV' | 'HMV';
  licenseExpiry: string;
  contact: string;
  tripCompletionRate: string | number;
  status: DriverStatus;
  assignable: boolean;
  licenseExpired: boolean;
}

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
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
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
  const message = (key: string) => fieldErrors[key] && <p className="mt-1 text-xs text-destructive">{fieldErrors[key]}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Drivers &amp; Safety</h1>
          <p className="mt-1 text-sm text-muted-foreground">Expired licenses and suspended drivers cannot be assigned to trips.</p>
        </div>
        {writable && <Button onClick={resetForm}><Plus className="h-4 w-4" /> Add Driver</Button>}
      </div>

      {writable && (
        <Card>
          <CardHeader><CardTitle>{editing ? `Edit ${editing.name}` : 'Add Driver'}</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={submit}>
              <div><Label htmlFor="driver-name">Driver name</Label><Input id="driver-name" value={form.name} onChange={(e) => field('name', e.target.value)} />{message('name')}</div>
              <div><Label htmlFor="license-no">License number</Label><Input id="license-no" value={form.licenseNo} onChange={(e) => field('licenseNo', e.target.value)} />{message('licenseNo')}</div>
              <div><Label htmlFor="license-category">Category</Label><Select id="license-category" value={form.licenseCategory} onChange={(e) => field('licenseCategory', e.target.value)}><option value="LMV">LMV</option><option value="HMV">HMV</option></Select>{message('licenseCategory')}</div>
              <div><Label htmlFor="license-expiry">License expiry</Label><Input id="license-expiry" type="date" value={form.licenseExpiry} onChange={(e) => field('licenseExpiry', e.target.value)} />{message('licenseExpiry')}</div>
              <div><Label htmlFor="contact">Contact</Label><Input id="contact" value={form.contact} onChange={(e) => field('contact', e.target.value)} />{message('contact')}</div>
              <div><Label htmlFor="completion-rate">Trip completion rate (%)</Label><Input id="completion-rate" type="number" min="0" max="100" value={form.tripCompletionRate} onChange={(e) => field('tripCompletionRate', e.target.value)} />{message('tripCompletionRate')}</div>
              {formError && <p className="text-sm text-destructive md:col-span-2 xl:col-span-3">{formError}</p>}
              <div className="flex gap-2 md:col-span-2 xl:col-span-3"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Driver'}</Button>{editing && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}</div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? <p className="p-6 text-muted-foreground">Loading drivers…</p> : error ? <p className="p-6 text-destructive">{error}</p> : drivers.length === 0 ? <p className="p-6 text-muted-foreground">No drivers have been added yet.</p> : (
            <Table>
              <THead><TR><TH>Driver</TH><TH>License</TH><TH>Expiry</TH><TH>Contact</TH><TH>Completion</TH><TH>Safety</TH><TH>Status</TH>{writable && <TH>Actions</TH>}</TR></THead>
              <TBody>{drivers.map((driver) => (
                <TR key={driver.id}>
                  <TD className="font-medium">{driver.name}<div className="text-xs text-muted-foreground">{driver.licenseCategory}</div></TD>
                  <TD>{driver.licenseNo}</TD>
                  <TD className={driver.licenseExpired ? 'font-medium text-destructive' : ''}>{driver.licenseExpired && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}{dateInput(driver.licenseExpiry)}{driver.licenseExpired && <div className="text-xs">EXPIRED</div>}</TD>
                  <TD>{driver.contact}</TD><TD>{Number(driver.tripCompletionRate)}%</TD>
                  <TD>{driver.assignable ? <span className="text-status-available">Clear</span> : <span className="text-destructive">Blocked</span>}</TD>
                  <TD><StatusBadge status={driver.status} /></TD>
                  {writable && <TD><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => beginEdit(driver)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>{driver.status !== 'ON_TRIP' && <Select aria-label={`Set ${driver.name} status`} className="h-9 w-auto" value={driver.status} onChange={(e) => void setStatus(driver, e.target.value as DriverStatus)}><option value="AVAILABLE">Available</option><option value="OFF_DUTY">Off Duty</option><option value="SUSPENDED">Suspended</option></Select>}</div></TD>}
                </TR>
              ))}</TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
