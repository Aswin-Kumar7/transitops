import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  Search01Icon, RefreshIcon, CheckmarkCircle02Icon,
  Calendar03Icon, ArrowRight01Icon, MoreHorizontalIcon,
  DashboardCircleIcon, ArrowUpRight01Icon
} from 'hugeicons-react';
import { api } from '@/lib/api';

const GREEN = '#1B5E47';

interface Kpis {
  activeVehicles: number; availableVehicles: number; inMaintenance: number;
  activeTrips: number; pendingTrips: number; driversOnDuty: number; fleetUtilization: number;
}
interface Summary {
  kpis: Kpis;
  vehicleStatus: { status: string; count: number }[];
  tripStatus: { status: string; count: number }[];
  driverStatus: { status: string; count: number }[];
  activityTrend: { label: string; value: number }[];
  filters: { types: string[]; statuses: string[]; regions: string[] };
  recentTrips: { tripCode: string; vehicle: string; driver: string; status: string; startTime: string | null }[];
}

type ActiveCard = 'fleet' | 'trips' | 'workforce' | null;

const TRIP_META: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'DRAFT', bg: 'bg-gray-100', text: 'text-black' },
  DISPATCHED: { label: 'DISPATCHED', bg: 'bg-black', text: 'text-white' },
  COMPLETED: { label: 'COMPLETED', bg: 'bg-[#E5F5EF]', text: 'text-[#1B5E47]' },
  CANCELLED: { label: 'CANCELLED', bg: 'bg-red-100', text: 'text-black' },
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10B981', ON_TRIP: '#111', IN_SHOP: '#F59E0B', RETIRED: '#EF4444',
  DRAFT: '#9CA3AF', DISPATCHED: '#111', COMPLETED: '#1B5E47', CANCELLED: '#EF4444',
  OFF_DUTY: '#6B7280', SUSPENDED: '#EF4444',
};

const cardBase = 'rounded-[32px] shadow-sm flex flex-col justify-between p-5 relative overflow-hidden cursor-pointer transition-all duration-300';
const cardWhite = 'bg-white rounded-[32px] shadow-sm flex flex-col min-h-0 border-none';
const pill = 'relative flex items-center gap-2 rounded-2xl border-none bg-white shadow-sm py-2.5 pl-4 pr-3 text-sm font-medium transition-shadow hover:shadow-md';

const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111] text-white rounded-2xl shadow-xl p-4 font-poppins text-sm z-50">
        <p className="font-normal text-white/70 mb-2">{label}</p>
        <span className="font-semibold text-xl">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [activeCard, setActiveCard] = useState<ActiveCard>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (region) params.set('region', region);
    const qs = params.toString();
    api.get<Summary>(`/dashboard/summary${qs ? `?${qs}` : ''}`).then(setData).catch((e) => setError(e.message));
  }, [type, status, region]);

  const toggleCard = (card: ActiveCard) => setActiveCard((prev) => (prev === card ? null : card));

  const shell = 'font-poppins h-full text-[#111] overflow-hidden flex flex-col';

  if (error) return <div className={shell}><div className="bg-red-50 text-black p-6 rounded-3xl font-normal shadow-sm">{error}</div></div>;
  if (!data) return <div className={shell}><div className="flex items-center justify-center flex-1 text-black font-normal text-lg">Loading dashboard…</div></div>;

  const chartData = activeCard === 'fleet'
    ? data.vehicleStatus.map((v) => ({ label: humanize(v.status), value: v.count, color: STATUS_COLORS[v.status] || '#9CA3AF' }))
    : activeCard === 'trips'
    ? data.tripStatus.map((t) => ({ label: humanize(t.status), value: t.count, color: STATUS_COLORS[t.status] || '#9CA3AF' }))
    : activeCard === 'workforce'
    ? data.driverStatus.map((d) => ({ label: humanize(d.status), value: d.count, color: STATUS_COLORS[d.status] || '#9CA3AF' }))
    : null;

  const chartTitle = activeCard === 'fleet' ? 'Vehicle Status Breakdown'
    : activeCard === 'trips' ? 'Trip Status Breakdown'
    : activeCard === 'workforce' ? 'Driver Status Breakdown'
    : 'Activity Trend';

  const chartLabel = activeCard === 'fleet' ? 'This Week'
    : activeCard === 'trips' ? 'All Trips'
    : activeCard === 'workforce' ? 'All Drivers'
    : 'This Week';

  return (
    <div className={shell}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-black flex items-center gap-2">
          <DashboardCircleIcon size={24} /> Dashboard
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-black bg-white shadow-sm">
            <Search01Icon size={18} strokeWidth={2.5} />
          </div>
          <label className={pill}>
            <span className="text-gray-400 font-normal">Vehicle</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="cursor-pointer appearance-none bg-white pr-6 font-semibold text-black outline-none w-24">
              <option value="">All</option>
              {data.filters.types.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
            </select>
          </label>
          <label className={pill}>
            <span className="text-gray-400 font-normal">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="cursor-pointer appearance-none bg-white pr-6 font-semibold text-black outline-none w-20">
              <option value="">All</option>
              {data.filters.statuses.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
            </select>
          </label>
          <label className={pill}>
            <span className="text-gray-400 font-normal">Region</span>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="cursor-pointer appearance-none bg-white pr-6 font-semibold text-black outline-none w-20">
              <option value="">All</option>
              {data.filters.regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <button onClick={() => { setType(''); setStatus(''); setRegion(''); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-black bg-white shadow-sm rounded-2xl h-11 transition-colors ml-2">
            <RefreshIcon size={16} strokeWidth={2.5} /> Reset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">

        {/* Fleet Health */}
        <div
          onClick={() => toggleCard('fleet')}
          className={`${cardBase} ${activeCard === 'fleet' ? 'bg-[#1B5E47] text-white shadow-xl' : activeCard === null ? 'bg-[#1B5E47] text-white' : 'bg-white text-black hover:bg-gray-50'}`}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <h2 className={`text-sm font-medium ${activeCard !== null && activeCard !== 'fleet' ? 'text-gray-500' : 'opacity-90'}`}>Fleet Health</h2>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeCard !== null && activeCard !== 'fleet' ? 'bg-gray-100 text-gray-500' : 'bg-white text-[#1B5E47]'}`}>
              <ArrowUpRight01Icon size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="my-1 relative z-10">
            <p className="text-5xl font-semibold">{data.kpis.fleetUtilization}%</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${activeCard !== null && activeCard !== 'fleet' ? 'bg-gray-100 text-gray-600' : 'bg-[#2D735C] text-white'}`}>
                <ArrowUpRight01Icon size={12} strokeWidth={3} /> Optimal
              </div>
              <span className={`text-xs font-normal ${activeCard !== null && activeCard !== 'fleet' ? 'text-gray-400' : 'opacity-80'}`}>Utilization rate</span>
            </div>
          </div>
          <div className={`flex items-center justify-between mt-4 pt-4 relative z-10 ${activeCard !== null && activeCard !== 'fleet' ? 'border-t border-gray-100' : 'border-t border-white/10'}`}>
            <div className="text-center">
              <p className={`text-xs font-normal mb-1 ${activeCard !== null && activeCard !== 'fleet' ? 'text-gray-400' : 'opacity-70'}`}>Active</p>
              <p className="text-base font-semibold">{data.kpis.activeVehicles}</p>
            </div>
            <div className={`text-center pl-4 ${activeCard !== null && activeCard !== 'fleet' ? 'border-l border-gray-100' : 'border-l border-white/10'}`}>
              <p className={`text-xs font-normal mb-1 ${activeCard !== null && activeCard !== 'fleet' ? 'text-gray-400' : 'opacity-70'}`}>Available</p>
              <p className="text-base font-semibold">{data.kpis.availableVehicles}</p>
            </div>
            <div className={`text-center pl-4 ${activeCard !== null && activeCard !== 'fleet' ? 'border-l border-gray-100' : 'border-l border-white/10'}`}>
              <p className={`text-xs font-normal mb-1 ${activeCard !== null && activeCard !== 'fleet' ? 'text-gray-400' : 'opacity-70'}`}>In Shop</p>
              <p className="text-base font-semibold">{data.kpis.inMaintenance}</p>
            </div>
          </div>
        </div>

        {/* Trip Operations */}
        <div
          onClick={() => toggleCard('trips')}
          className={`${cardBase} ${activeCard === 'trips' ? 'bg-[#1B5E47] text-white shadow-xl' : 'bg-white text-black hover:bg-gray-50'}`}
        >
          <div className="flex justify-between items-start mb-3">
            <h2 className={`text-sm font-medium ${activeCard === 'trips' ? 'text-white/90' : 'text-gray-600'}`}>Trip Operations</h2>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeCard === 'trips' ? 'bg-white text-[#1B5E47]' : 'border border-gray-100 text-gray-400 hover:text-black'}`}>
              <ArrowUpRight01Icon size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="my-1">
            <p className="text-5xl font-semibold">{data.kpis.activeTrips}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${activeCard === 'trips' ? 'bg-[#2D735C] text-white' : 'bg-[#E5F5EF] text-[#1B5E47]'}`}>
                <ArrowUpRight01Icon size={12} strokeWidth={3} /> Active
              </div>
              <span className={`text-xs font-normal ${activeCard === 'trips' ? 'text-white/70' : 'text-gray-400'}`}>Currently en route</span>
            </div>
          </div>
          <div className={`flex items-center justify-start mt-4 pt-4 gap-8 ${activeCard === 'trips' ? 'border-t border-white/10' : 'border-t border-gray-50'}`}>
            <div>
              <p className={`text-xs font-normal mb-1 ${activeCard === 'trips' ? 'text-white/70' : 'text-gray-400'}`}>Pending Next</p>
              <p className="text-base font-semibold">{data.kpis.pendingTrips}</p>
            </div>
          </div>
        </div>

        {/* Workforce */}
        <div
          onClick={() => toggleCard('workforce')}
          className={`${cardBase} ${activeCard === 'workforce' ? 'bg-[#1B5E47] text-white shadow-xl' : 'bg-white text-black hover:bg-gray-50'}`}
        >
          <div className="flex justify-between items-start mb-3">
            <h2 className={`text-sm font-medium ${activeCard === 'workforce' ? 'text-white/90' : 'text-gray-600'}`}>Workforce</h2>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeCard === 'workforce' ? 'bg-white text-[#1B5E47]' : 'border border-gray-100 text-gray-400 hover:text-black'}`}>
              <ArrowUpRight01Icon size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="my-1">
            <p className="text-5xl font-semibold">{data.kpis.driversOnDuty}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${activeCard === 'workforce' ? 'bg-[#2D735C] text-white' : 'bg-[#E5F5EF] text-[#1B5E47]'}`}>
                <CheckmarkCircle02Icon size={12} strokeWidth={3} /> Stable
              </div>
              <span className={`text-xs font-normal ${activeCard === 'workforce' ? 'text-white/70' : 'text-gray-400'}`}>Drivers clocked in</span>
            </div>
          </div>
          <div className={`flex items-center justify-start mt-4 pt-4 gap-8 ${activeCard === 'workforce' ? 'border-t border-white/10' : 'border-t border-gray-50'}`}>
            <div>
              <p className={`text-xs font-normal mb-1 ${activeCard === 'workforce' ? 'text-white/70' : 'text-gray-400'}`}>Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${activeCard === 'workforce' ? 'bg-white' : 'bg-[#1B5E47]'}`} />
                <p className="text-sm font-semibold">Optimal Coverage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Recent Trips */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Chart — switches between area (default) and bar (when card selected) */}
        <div className={`lg:col-span-5 ${cardWhite} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-medium text-black">{chartTitle}</h2>
            <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-100">
              <Calendar03Icon size={14} className="text-black" />
              {chartLabel}
            </div>
          </div>
          <div className="flex-1 min-h-[200px] relative mt-2 -ml-4">
            {chartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGreenActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} width={30} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke={GREEN} strokeWidth={3} fill="url(#colorGreenActive)" activeDot={{ r: 5, fill: GREEN, stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.activityTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} dy={10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke={GREEN} strokeWidth={3} fill="url(#colorGreen)" activeDot={{ r: 5, fill: GREEN, stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Trips */}
        <div className={`lg:col-span-7 ${cardWhite}`}>
          <div className="p-6 pb-4 border-b border-gray-50 flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-black">Recent Trips</h2>
            <button className="text-sm font-semibold text-gray-400 hover:text-black flex items-center gap-1 transition-colors">
              View all <ArrowRight01Icon size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex-1 overflow-auto px-2">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Trip ID</th>
                  <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vehicle</th>
                  <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Driver</th>
                  <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Start Time</th>
                  <th className="px-5 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentTrips.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-sm font-normal text-gray-400">No recent trips found.</td></tr>
                ) : (
                  data.recentTrips.map((trip, i) => {
                    const meta = TRIP_META[trip.status] || TRIP_META['DRAFT'];
                    return (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-semibold text-black">{trip.tripCode}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{trip.vehicle || '—'}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{trip.driver || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wider ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-500">{trip.startTime ? new Date(trip.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button className="text-gray-400 hover:text-black p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                            <MoreHorizontalIcon size={18} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
