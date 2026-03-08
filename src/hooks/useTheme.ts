import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'amoled';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xtratoon-theme');
      if (stored === 'dark' || stored === 'light' || stored === 'amoled') return stored as ThemeMode;
      return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'amoled');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'amoled') root.classList.add('dark', 'amoled');
    localStorage.setItem('xtratoon-theme', theme);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'amoled';
      return 'light';
    });
  }, []);

  // Keep toggleTheme for backward compat
  return { theme, toggleTheme: cycleTheme, cycleTheme };
}
