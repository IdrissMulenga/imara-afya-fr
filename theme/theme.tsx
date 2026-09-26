// Light or dark palette, following the phone. Read with useTheme().
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, type Theme } from './tokens';

const ThemeContext = createContext<{ c: Theme; isDark: boolean }>({ c: light, isDark: false });

/** Provides the light or dark colours, following the phone setting. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const value = useMemo(() => ({ c: isDark ? dark : light, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
