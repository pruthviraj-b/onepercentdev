'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type DesignTheme = 'light' | 'dark' | 'high-contrast';
type ThemeContextValue = { theme: DesignTheme; setTheme: (theme: DesignTheme) => void };
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'light' }: { children: ReactNode; defaultTheme?: DesignTheme }) {
  const [theme, setTheme] = useState<DesignTheme>(defaultTheme);
  useEffect(() => {
    const stored = window.localStorage.getItem('design-system-theme') as DesignTheme | null;
    if (stored && ['light', 'dark', 'high-contrast'].includes(stored)) setTheme(stored);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('design-system-theme', theme);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within DesignSystemThemeProvider');
  return value;
}
