'use client';

import { useRole } from '../providers/RoleProvider';

export function RequireRole({ role, children, fallback = null }: { role: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  return <>{useRole().hasRole(role) ? children : fallback}</>;
}
