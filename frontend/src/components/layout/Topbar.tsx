import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ROLE_LABELS, type SearchResults } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
      <div ref={boxRef} className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search vehicles, drivers, trips…"
          className="pl-9"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && q.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 max-h-96 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
            {total === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No matches for “{q.trim()}”.</p>
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
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials}
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Row({ title, status, onClick }: { title: string; status: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent">
      <span className="truncate">{title}</span>
      <StatusBadge status={status} />
    </button>
  );
}
