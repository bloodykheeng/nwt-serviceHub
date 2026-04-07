import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '@/constants/theme';
import { ThemeColors, ColorScheme } from '@/types';

const THEME_KEY = 'nwt_theme_preference';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const [colorScheme, setColorScheme] = useState<ColorScheme>(systemScheme);

  // Load saved preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setColorScheme(saved);
      }
    });
  }, []);

  const setTheme = useCallback(async (scheme: ColorScheme) => {
    setColorScheme(scheme);
    await AsyncStorage.setItem(THEME_KEY, scheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme, setTheme]);

  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ colorScheme, colors, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside ThemeProvider');
  return ctx;
}
