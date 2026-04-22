import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors, lightColors, darkColors } from '@/constants/Theme';
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'dark' || val === 'light') setMode(val);
    });
  }, []);

  function toggleTheme() {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <AppThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}
