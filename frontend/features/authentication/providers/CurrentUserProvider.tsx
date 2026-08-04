'use client';

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import { useAuth } from '../AuthProvider';

const CurrentUserContext = createContext<User | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={useAuth().user}>{children}</CurrentUserContext.Provider>;
}

export const useCurrentUser = () => useContext(CurrentUserContext);
