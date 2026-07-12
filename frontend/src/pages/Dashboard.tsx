import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';

interface Summary {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: number;
  };
  vehicleStatus: { status: string; count: number }[];
  recentTrips: { tripCode: string; vehicle: string; driver: string; status: string }[];
}

const KPI_META: { key: keyof Summary['kpis']; label: string; suffix?: string }[] = [
  { key: 'activeVehicles', label: 'Active Vehicles' },
  { key: 'availableVehicles', label: 'Available Vehicles' },
  { key: 'inMaintenance', label: 'In Maintenance' },
  { key: 'activeTrips', label: 'Active Trips' },
  { key: 'pendingTrips', label: 'Pending Trips' },
  { key: 'driversOnDuty', label: 'Drivers On Duty' },
  { key: 'fleetUtilization', label: 'Fleet Utilization', suffix: '%' },
];

export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Summary>('/dashboard/summary').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading dashboard…</p>;

  const totalStatus = data.vehicleStatus.reduce((s, v) => s + v.count, 0) || 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {KPI_META.map(({ key, label, suffix }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-2 text-3xl font-bold">
                {data.kpis[key]}
                {suffix}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Trips</h2>
            <Table>
              <THead>
                <TR>
                  <TH>Trip</TH>
                  <TH>Vehicle</TH>
                  <TH>Driver</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {data.recentTrips.map((t) => (
                  <TR key={t.tripCode}>
                    <TD className="font-medium">{t.tripCode}</TD>
                    <TD>{t.vehicle}</TD>
                    <TD>{t.driver}</TD>
                    <TD>
                      <StatusBadge status={t.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vehicle Status</h2>
            <div className="space-y-3">
              {data.vehicleStatus.map((v) => (
                <div key={v.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <StatusBadge status={v.status} />
                    <span className="text-muted-foreground">{v.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(v.count / totalStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
