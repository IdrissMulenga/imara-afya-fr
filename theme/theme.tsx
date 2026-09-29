// Light or dark palette: follows the phone, or the user's choice in Settings. Read with useTheme().
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { light, dark, type Theme } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';
export const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

const STORE_KEY = 'imara.theme';

type ThemeValue = {
  c: Theme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeValue>({
  c: light,
  isDark: false,
  mode: 'system',
  setMode: () => {},
});

// Also sets native parts (keyboard, alerts, date pickers) to the same scheme.
const applyNative = (mode: ThemeMode) => {
  try {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  } catch {
    // Not available on this platform.
  }
};

/** Provides the colours for the chosen mode, loading the saved choice at start. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    SecureStore.getItemAsync(STORE_KEY)
      .then((saved) => {
        if (saved && (THEME_MODES as readonly string[]).includes(saved)) {
          setModeState(saved as ThemeMode);
          applyNative(saved as ThemeMode);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyNative(next);
    SecureStore.setItemAsync(STORE_KEY, next).catch(() => {});
  }, []);

  const isDark = mode === 'system' ? scheme === 'dark' : mode === 'dark';
  const value = useMemo(
    () => ({ c: isDark ? dark : light, isDark, mode, setMode }),
    [isDark, mode, setMode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
