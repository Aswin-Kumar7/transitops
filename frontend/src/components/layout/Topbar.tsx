import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search01Icon, Logout01Icon } from 'hugeicons-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ROLE_LABELS, type SearchResults } from '@/types';
import { StatusBadge } from '@/components/ui/badge';

const EMPTY: SearchResults = { vehicles: [], drivers: [], trips: [] };

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced global search.
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const t = setTimeout(() => {
      api.get<SearchResults>(`/search?q=${encodeURIComponent(q.trim())}`).then(setResults).catch(() => setResults(EMPTY));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const initials = user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const total = results.vehicles.length + results.drivers.length + results.trips.length;

  const go = (path: string) => {
    setOpen(false);
    setQ('');
    navigate(path);
  };

  return (
    <header className="flex h-20 w-full items-center border-none bg-transparent px-6 md:px-8 font-poppins shrink-0">
      <div className="flex flex-1 items-center gap-4 mx-auto max-w-[1600px] w-full">
        <div ref={boxRef} className="relative max-w-md flex-1">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Search01Icon size={18} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          placeholder="Search vehicles, drivers, trips…"
          className="w-full rounded-2xl bg-white border-none py-3 pl-12 pr-4 text-sm font-medium text-black shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B5E47]/20 transition-all"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && q.trim().length >= 2 && (
          <div className="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-3xl border-none bg-white p-2 shadow-xl">
            {total === 0 ? (
              <p className="p-4 text-sm font-normal text-gray-500">No matches for “{q.trim()}”.</p>
            ) : (
              <div className="py-1">
                {results.vehicles.length > 0 && (
                  <Group label="Vehicles">
                    {results.vehicles.map((v) => (
                      <Row key={v.id} onClick={() => go('/fleet')} title={`${v.registrationNo} — ${v.name}`} status={v.status} />
                    ))}
                  </Group>
                )}
                {results.drivers.length > 0 && (
                  <Group label="Drivers">
                    {results.drivers.map((d) => (
                      <Row key={d.id} onClick={() => go('/drivers')} title={`${d.name} · ${d.licenseNo}`} status={d.status} />
                    ))}
                  </Group>
                )}
                {results.trips.length > 0 && (
                  <Group label="Trips">
                    {results.trips.map((t) => (
                      <Row key={t.id} onClick={() => go('/trips')} title={`${t.tripCode} · ${t.source} → ${t.destination}`} status={t.status} />
                    ))}
                  </Group>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-black leading-tight">{user.name}</div>
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{ROLE_LABELS[user.role]}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5F5EF] text-sm font-semibold text-[#1B5E47]">
          {initials}
        </div>
        <button onClick={logout} title="Sign out" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-gray-400 hover:text-black hover:bg-gray-50 transition-colors shadow-sm">
          <Logout01Icon size={20} strokeWidth={2.5} />
        </button>
      </div>
      </div>
    </header>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      {children}
    </div>
  );
}

function Row({ title, status, onClick }: { title: string; status: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors">
      <span className="truncate font-medium text-black">{title}</span>
      <StatusBadge status={status} />
    </button>
  );
}
