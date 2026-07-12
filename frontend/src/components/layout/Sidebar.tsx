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
    <aside className="flex w-64 flex-col border-none bg-white font-poppins">
      <div className="flex h-20 items-center px-8">
        <span className="text-2xl font-semibold tracking-tight text-black">TransitOps</span>
      </div>
      <nav className="flex flex-1 flex-col gap-2 px-4 py-4">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#1B5E47] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-black',
              )
            }
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-8 py-6 text-xs font-medium uppercase tracking-wider text-gray-400">
        TransitOps © 2026
      </div>
    </aside>
  );
}
