'use client';

import { useSession } from '../providers/SessionProvider';

export function RequireAuth({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isAuthenticated } = useSession();
  return <>{isAuthenticated ? children : fallback}</>;
}
