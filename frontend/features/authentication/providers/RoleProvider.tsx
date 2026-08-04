'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../AuthProvider';

interface RoleContextValue { roles: string[]; hasRole: (role: string) => boolean; }
const RoleContext = createContext<RoleContextValue>({ roles: [], hasRole: () => false });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const roles = useMemo(() => user ? ['student'] : ['guest'], [user]);
  const value = useMemo(() => ({ roles, hasRole: (role: string) => roles.includes(role) }), [roles]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);
