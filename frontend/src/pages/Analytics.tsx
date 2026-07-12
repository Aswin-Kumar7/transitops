import { useEffect, useState } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { AnalyticsOverview } from '@/types';
import { ChartLineData01Icon } from 'hugeicons-react';

const cardStyles = 'bg-white rounded-[32px] shadow-sm flex flex-col min-h-0 border-none p-6 lg:p-8';

export default function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AnalyticsOverview>('/analytics/overview').then(setData).catch((e: ApiError) => setError(e.message));
  }, []);

  return (
    <div className="font-poppins flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#1B5E47] bg-white shadow-sm">
            <ChartLineData01Icon size={22} strokeWidth={2.5} />
          </div>
          Reports &amp; Analytics
        </h1>
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-sm">{error}</p>}
      {!data && !error && <p className="text-sm font-medium text-gray-500">Loading analytics…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Fuel Efficiency', value: `${data.fuelEfficiency} km/l` },
              { label: 'Fleet Utilization', value: `${data.fleetUtilization}%` },
              { label: 'Operational Cost', value: formatCurrency(data.operationalCost) },
              { label: 'Vehicle ROI', value: `${data.vehicleRoi}%` },
            ].map((k) => (
              <div key={k.label} className="rounded-[32px] bg-white shadow-sm p-6 lg:p-8 border-none flex flex-col justify-center">
                <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{k.label}</div>
                <div className="mt-1 text-2xl font-semibold text-black">{k.value}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cardStyles}>
              <h2 className="mb-6 text-lg font-semibold text-black">Monthly Revenue</h2>
              {data.monthlyRevenue.length === 0 ? <p className="text-sm font-medium text-gray-500">No completed-trip revenue yet.</p> : (
                <div className="flex-1 min-h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyRevenue} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1B5E47" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#1B5E47" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F6" />
                      <XAxis dataKey="month" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} dy={10} />
                      <YAxis fontSize={10} fontWeight={600} tickLine={false} axisLine={false} width={80} tickFormatter={(v: number) => `₹${v/1000}k`} tick={{fill: '#9CA3AF'}} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#1B5E47" strokeWidth={3} fill="url(#revenueGradient)" activeDot={{ r: 5, fill: '#1B5E47', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className={cardStyles}>
              <h2 className="mb-6 text-lg font-semibold text-black">Top Costliest Vehicles</h2>
              {data.topCostliestVehicles.every((v) => v.cost === 0) ? <p className="text-sm font-medium text-gray-500">No vehicle costs recorded yet.</p> : (
                <div className="flex-1 min-h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.topCostliestVehicles} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <XAxis type="number" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v: number) => `₹${v/1000}k`} tick={{fill: '#9CA3AF'}} />
                      <YAxis type="category" dataKey="name" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} width={80} tick={{fill: '#9CA3AF'}} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="cost" fill="#1B5E47" radius={10 as any} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className={`${cardStyles} p-0 overflow-hidden`}>
            <div className="p-8 pb-4">
              <h2 className="text-lg font-semibold text-black">Per-Vehicle ROI</h2>
            </div>
            <div className="overflow-x-auto px-8 pb-8">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">Vehicle</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">Revenue</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">Fuel</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">Maintenance</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perVehicle.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-black text-sm rounded-l-2xl">{v.name}</td>
                      <td className="px-4 py-3 font-medium text-gray-600 text-sm">{formatCurrency(v.revenue)}</td>
                      <td className="px-4 py-3 font-medium text-gray-600 text-sm">{formatCurrency(v.fuelCost)}</td>
                      <td className="px-4 py-3 font-medium text-gray-600 text-sm">{formatCurrency(v.maintenanceCost)}</td>
                      <td className={`px-4 py-3 font-semibold text-sm rounded-r-2xl ${v.roi >= 0 ? 'text-[#1B5E47]' : 'text-red-600'}`}>{v.roi}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
