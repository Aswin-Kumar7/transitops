import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, tokenStore } from '@/lib/api';
import type { AuthResponse, User, Permissions, Module, Role } from '@/types';

interface AuthContextValue {
  user: User | null;
  permissions: Permissions | null;
  loading: boolean;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
  /** Can the current user open/read a module? */
  canRead: (module: Module) => boolean;
  /** Can the current user write within a module? */
  canWrite: (module: Module) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);

  // On boot, if a token exists, restore the session.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User; permissions: Permissions }>('/auth/me')
      .then((res) => {
        setUser(res.user);
        setPermissions(res.permissions);
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, role?: Role) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password, role });
    tokenStore.set(res.token);
    setUser(res.user);
    setPermissions(res.permissions);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setPermissions(null);
  }, []);

  const canRead = useCallback((module: Module) => !!permissions && permissions[module] !== 'none', [permissions]);
  const canWrite = useCallback((module: Module) => !!permissions && permissions[module] === 'full', [permissions]);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, canRead, canWrite }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
