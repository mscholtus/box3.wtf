import { useState, useEffect, useMemo } from 'react';
import { getTheme } from '../constants/theme';

/**
 * Custom hook for theme management with system preference detection
 * Supports three modes: "dark", "light", "system"
 * @returns {Object} Theme state and toggle function
 */
export function useTheme() {
  // Get system preference
  const getSystemPreference = () => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  };

  // darkMode can be "dark", "light", or "system"
  const [darkMode, setDarkMode] = useState("system");
  const [systemIsDark, setSystemIsDark] = useState(getSystemPreference);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemIsDark(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine the effective dark mode based on setting
  const effectiveDarkMode = useMemo(() => {
    if (darkMode === "system") return systemIsDark;
    return darkMode === "dark";
  }, [darkMode, systemIsDark]);

  // Apply dark class to html element for Tailwind dark mode
  useEffect(() => {
    if (effectiveDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveDarkMode]);

  // Keep legacy theme object for gradual migration
  const theme = useMemo(() => getTheme(effectiveDarkMode), [effectiveDarkMode]);

  return { darkMode, setDarkMode, theme, isDark: effectiveDarkMode };
}
