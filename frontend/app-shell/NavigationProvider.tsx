'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ShellSection } from './types';

type NavigationContextValue = {
  sidebarOpen: boolean; sidebarPinned: boolean; setSidebarOpen: (open: boolean) => void;
  setSidebarPinned: (pinned: boolean) => void; activeSection?: ShellSection;
  setActiveSection: (section?: ShellSection) => void; searchOpen: boolean; setSearchOpen: (open: boolean) => void;
  commandOpen: boolean; setCommandOpen: (open: boolean) => void; notificationsOpen: boolean; setNotificationsOpen: (open: boolean) => void;
};
const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [activeSection, setActiveSection] = useState<ShellSection>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('app-shell-sidebar-pinned');
    if (stored !== null) { const pinned = stored === 'true'; setSidebarPinned(pinned); setSidebarOpen(pinned); }
  }, []);
  useEffect(() => { window.localStorage.setItem('app-shell-sidebar-pinned', String(sidebarPinned)); }, [sidebarPinned]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); }
      else if (modifier && event.key.toLowerCase() === 'b') { event.preventDefault(); setSidebarOpen((open) => !open); }
      else if (modifier && event.key === '/') { event.preventDefault(); setSearchOpen(true); }
      else if (event.key === 'Escape') { setCommandOpen(false); setSearchOpen(false); setNotificationsOpen(false); }
    };
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const value = useMemo(() => ({ sidebarOpen, sidebarPinned, setSidebarOpen, setSidebarPinned, activeSection, setActiveSection, searchOpen, setSearchOpen, commandOpen, setCommandOpen, notificationsOpen, setNotificationsOpen }), [sidebarOpen, sidebarPinned, activeSection, searchOpen, commandOpen, notificationsOpen]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() { const value = useContext(NavigationContext); if (!value) throw new Error('useNavigation must be used within NavigationProvider'); return value; }
