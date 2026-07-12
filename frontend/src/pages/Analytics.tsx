import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { api, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsOverview } from '@/types';

const BAR_COLORS = ['#dc2626', '#f59e0b', '#2563eb', '#16a34a', '#6b7280'];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AnalyticsOverview>('/analytics/overview').then(setData).catch((e: ApiError) => setError(e.message));
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading analytics…</p>;

  const kpis = [
    { label: 'Fuel Efficiency', value: `${data.fuelEfficiency} km/l`, accent: 'border-l-status-ontrip' },
    { label: 'Fleet Utilization', value: `${data.fleetUtilization}%`, accent: 'border-l-status-available' },
    { label: 'Operational Cost', value: formatCurrency(data.operationalCost), accent: 'border-l-status-inshop' },
    { label: 'Vehicle ROI', value: `${data.vehicleRoi}%`, accent: 'border-l-status-available' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports &amp; Analytics</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className={`border-l-4 ${k.accent}`}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            {data.monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed-trip revenue yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.monthlyRevenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'hsl(210 40% 96%)' }} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Costliest Vehicles</CardTitle></CardHeader>
          <CardContent>
            {data.topCostliestVehicles.every((v) => v.cost === 0) ? (
              <p className="text-sm text-muted-foreground">No vehicle costs recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart layout="vertical" data={data.topCostliestVehicles} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} width={72} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'hsl(210 40% 96%)' }} />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                    {data.topCostliestVehicles.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-vehicle ROI breakdown */}
      <Card>
        <CardHeader><CardTitle>Per-Vehicle ROI</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Vehicle</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2 pr-4">Fuel</th>
                  <th className="py-2 pr-4">Maintenance</th>
                  <th className="py-2 pr-4">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.perVehicle.map((v) => (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{v.name}</td>
                    <td className="py-2 pr-4">{formatCurrency(v.revenue)}</td>
                    <td className="py-2 pr-4">{formatCurrency(v.fuelCost)}</td>
                    <td className="py-2 pr-4">{formatCurrency(v.maintenanceCost)}</td>
                    <td className={`py-2 pr-4 font-medium ${v.roi >= 0 ? 'text-status-available' : 'text-destructive'}`}>{v.roi}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
