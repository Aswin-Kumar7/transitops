import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/config/nav';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { canWrite } = useAuth();

  // Show Dashboard (module null) always; other items only if the role can EDIT them
  // (full access). Read-only (view) access does not surface a nav item.
  const items = NAV_ITEMS.filter((item) => item.module === null || canWrite(item.module));

  return (
    <aside className="flex w-60 flex-col border-r bg-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold tracking-tight">TransitOps</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-[10px] uppercase tracking-wider text-muted-foreground">
        TransitOps © 2026 · RBAC enabled
      </div>
    </aside>
  );
}
