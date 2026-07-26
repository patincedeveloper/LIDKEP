import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Account, PlatformData, Role } from './types';

type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  organization?: string;
  district?: string;
  role: Exclude<Role, 'SYSTEM_ADMINISTRATOR'>;
};

type PlatformContextValue = {
  data: PlatformData | null;
  user: Account | null;
  role: Role;
  loading: boolean;
  error: string;
  toast: string;
  notify: (message: string) => void;
  login: (email: string, password: string) => Promise<Account>;
  register: (input: RegisterInput) => Promise<{ user: Account; requiresApproval: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message ?? 'The request could not be completed.');
  return payload.data;
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlatformData | null>(null);
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadAuthenticatedData = async () => {
    const workspace = await apiRequest('/api/v1/auth/bootstrap');
    setData(workspace);
  };

  useEffect(() => {
    Promise.all([
      apiRequest('/api/v1/public/bootstrap'),
      apiRequest('/api/v1/auth/me').catch(() => null)
    ])
      .then(async ([publicData, identity]) => {
        setData({ ...publicData, users: [], assignments: [], reviews: [], revisions: [], engagements: [], notifications: [], verifications: [], auditLogs: [], criteria: [] });
        if (identity?.user) {
          setUser(identity.user);
          await loadAuthenticatedData();
        }
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setUser(result.user);
    await loadAuthenticatedData();
    return result.user;
  };

  const register = async (input: RegisterInput) => {
    const result = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    if (!result.requiresApproval) {
      setUser(result.user);
      await loadAuthenticatedData();
    }
    return result;
  };

  const logout = async () => {
    await apiRequest('/api/v1/auth/logout', { method: 'POST', body: '{}' });
    setUser(null);
    const publicData = await apiRequest('/api/v1/public/bootstrap');
    setData({ ...publicData, users: [], assignments: [], reviews: [], revisions: [], engagements: [], notifications: [], verifications: [], auditLogs: [], criteria: [] });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiRequest('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    setUser(null);
    const publicData = await apiRequest('/api/v1/public/bootstrap');
    setData({ ...publicData, users: [], assignments: [], reviews: [], revisions: [], engagements: [], notifications: [], verifications: [], auditLogs: [], criteria: [] });
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };
  const value = useMemo(() => ({
    data,
    user,
    role: user?.role ?? 'PUBLIC_USER',
    loading,
    error,
    toast,
    notify,
    login,
    register,
    changePassword,
    logout
  }), [data, user, loading, error, toast]);
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const value = useContext(PlatformContext);
  if (!value) throw new Error('usePlatform must be used inside PlatformProvider');
  return value;
}
