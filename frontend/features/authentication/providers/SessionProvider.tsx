'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthProvider';

interface SessionContextValue {
  sessionId: string | null;
  isAuthenticated: boolean;
  sessionStartedAt: string | null;
  logoutAllDevices: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  sessionId: null,
  isAuthenticated: false,
  sessionStartedAt: null,
  logoutAllDevices: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setSessionStartedAt(null); return; }
    const key = 'session_start';
    const existing = sessionStorage.getItem(key) || new Date().toISOString();
    sessionStorage.setItem(key, existing);
    setSessionStartedAt(existing);
  }, [user]);

  const value = useMemo(() => ({
    sessionId: user?.uid || null,
    isAuthenticated: Boolean(user),
    sessionStartedAt,
    logoutAllDevices: logout,
  }), [logout, sessionStartedAt, user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
