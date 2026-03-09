import { useEffect, useState, useCallback } from 'react';

const NIGHT_SHIFT_KEY = 'komixora-night-shift';

export function useNightShift() {
  const [enabled, setEnabledState] = useState(() => {
    try { return localStorage.getItem(NIGHT_SHIFT_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('night-shift');
    } else {
      root.classList.remove('night-shift');
    }
    localStorage.setItem(NIGHT_SHIFT_KEY, String(enabled));
  }, [enabled]);

  const toggle = useCallback(() => setEnabledState(prev => !prev), []);

  return { nightShift: enabled, toggleNightShift: toggle };
}
