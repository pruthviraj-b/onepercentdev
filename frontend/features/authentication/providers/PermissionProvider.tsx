'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../AuthProvider';

interface PermissionContextValue { permissions: string[]; hasPermission: (permission: string) => boolean; }
const PermissionContext = createContext<PermissionContextValue>({ permissions: [], hasPermission: () => false });

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const permissions = useMemo(() => user ? ['course.read', 'quiz.submit'] : [], [user]);
  const value = useMemo(() => ({ permissions, hasPermission: (permission: string) => permissions.includes(permission) }), [permissions]);
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export const usePermission = () => useContext(PermissionContext);
