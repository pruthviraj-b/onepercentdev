'use client';

import { CurrentUserProvider } from './CurrentUserProvider';
import { PermissionProvider } from './PermissionProvider';
import { RoleProvider } from './RoleProvider';
import { SessionProvider } from './SessionProvider';

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider><CurrentUserProvider><RoleProvider><PermissionProvider>{children}</PermissionProvider></RoleProvider></CurrentUserProvider></SessionProvider>;
}
