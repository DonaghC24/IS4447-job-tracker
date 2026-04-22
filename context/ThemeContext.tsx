// theme context - manages light/dark mode across the entire app
// the selected theme is persisted in async storage so it survives app restarts
// any component can call useapptheme() to get the current colours or toggle the mode

import { AppColors, darkColors, lightColors } from '@/constants/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
export type { AppColors };

const STORAGE_KEY = 'app_theme_mode';

export type ThemeMode = 'light' | 'dark';

type AppThemeContextValue = {
  mode: ThemeMode;
  colors: AppColors;
  toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  // load the saved theme preference from async storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'dark' || val === 'light') setMode(val);
    });
  }, []);

  // toggle between light and dark and persist the new value
  function toggleTheme() {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  // pick the correct colour set based on the current mode
  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <AppThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </AppThemeContext.Provider>
  );
}

// hook to access theme context - throws if used outside the provider
export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}