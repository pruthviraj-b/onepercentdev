'use client';

import { usePermission } from '../providers/PermissionProvider';

export function RequirePermission({ permission, children, fallback = null }: { permission: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  return <>{usePermission().hasPermission(permission) ? children : fallback}</>;
}
