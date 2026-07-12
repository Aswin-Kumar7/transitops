import { LogOut, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" />
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
