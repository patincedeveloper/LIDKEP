import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { DemoData, Role } from './types';

type DemoContextValue = {
  data: DemoData | null;
  loading: boolean;
  error: string;
  role: Role;
  setRole: (role: Role) => void;
  notify: (message: string) => void;
  toast: string;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem('lidkep-demo-role') as Role) || 'INNOVATOR');

  useEffect(() => {
    fetch('/api/v1/demo/bootstrap')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load the demo workspace.');
        return response.json();
      })
      .then((payload) => setData(payload.data))
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  const setRole = (nextRole: Role) => {
    localStorage.setItem('lidkep-demo-role', nextRole);
    setRoleState(nextRole);
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };
  const value = useMemo(() => ({ data, loading, error, role, setRole, notify, toast }), [data, loading, error, role, toast]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}
