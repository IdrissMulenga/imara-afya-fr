// constants/theme.ts — merged theme.
// 1) The imara afya design theme (palettes + ThemeProvider/useTheme) used by the
//    auth screens. Written with React.createElement so this stays a .ts file and
//    there's no theme.ts / theme.tsx module clash.
// 2) The original Expo template `Colors` / `Fonts` exports, kept so the template
//    screens (tabs, themed-text/view, icon-symbol) keep working unchanged.
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

/* ------------------------------ design theme ----------------------------- */

export type ThemeColors = {
  primary: string; primaryDeep: string; onPrimary: string;
  ring: string; shadow: string;
  heroFrom: string; heroMid: string; heroTo: string;
  bg: string; surface: string;
  text: string; textMuted: string; textFaint: string;
  fieldBg: string; border: string; borderStrong: string;
  danger: string; dangerRing: string;
};

export type PaletteName = 'forest' | 'ocean';

export const PALETTES: Record<PaletteName, { light: ThemeColors; dark: ThemeColors }> = {
  forest: {
    light: {
      primary: '#0a7d5a', primaryDeep: '#075c42', onPrimary: '#ffffff',
      ring: 'rgba(10,125,90,0.16)', shadow: 'rgba(10,125,90,0.30)',
      heroFrom: '#0e9468', heroMid: '#0a7d5a', heroTo: '#075c42',
      bg: '#f3f8f6', surface: '#ffffff',
      text: '#0f1a16', textMuted: '#5c6b64', textFaint: '#9aa8a1',
      fieldBg: '#eef2f0', border: 'rgba(15,26,22,0.09)', borderStrong: 'rgba(15,26,22,0.16)',
      danger: '#d92d20', dangerRing: 'rgba(217,45,32,0.14)',
    },
    dark: {
      primary: '#16b582', primaryDeep: '#16b582', onPrimary: '#04130d',
      ring: 'rgba(22,181,130,0.20)', shadow: 'rgba(0,0,0,0.5)',
      heroFrom: '#0e9468', heroMid: '#0a7d5a', heroTo: '#075c42',
      bg: '#0b1512', surface: '#15201c',
      text: '#eef4f1', textMuted: '#9bb0a8', textFaint: '#67786f',
      fieldBg: '#1b2723', border: 'rgba(255,255,255,0.10)', borderStrong: 'rgba(255,255,255,0.18)',
      danger: '#ff7a7a', dangerRing: 'rgba(255,122,122,0.18)',
    },
  },
  ocean: {
    light: {
      primary: '#1456b8', primaryDeep: '#0e3f8a', onPrimary: '#ffffff',
      ring: 'rgba(20,86,184,0.16)', shadow: 'rgba(20,86,184,0.30)',
      heroFrom: '#2a6fdb', heroMid: '#1456b8', heroTo: '#0e3f8a',
      bg: '#f4f7fc', surface: '#ffffff',
      text: '#0d1526', textMuted: '#5a6376', textFaint: '#9aa3b5',
      fieldBg: '#eef2f9', border: 'rgba(13,21,38,0.09)', borderStrong: 'rgba(13,21,38,0.16)',
      danger: '#d92d20', dangerRing: 'rgba(217,45,32,0.14)',
    },
    dark: {
      primary: '#5a93f0', primaryDeep: '#5a93f0', onPrimary: '#06122b',
      ring: 'rgba(90,147,240,0.20)', shadow: 'rgba(0,0,0,0.5)',
      heroFrom: '#2a6fdb', heroMid: '#1456b8', heroTo: '#0e3f8a',
      bg: '#0a0f1a', surface: '#111826',
      text: '#eef2fb', textMuted: '#9aa6bd', textFaint: '#67728a',
      fieldBg: '#161f30', border: 'rgba(255,255,255,0.10)', borderStrong: 'rgba(255,255,255,0.18)',
      danger: '#ff7a7a', dangerRing: 'rgba(255,122,122,0.18)',
    },
  },
};

export const RADIUS = 16; // shared corner radius for fields & buttons

type ThemeContextValue = {
  palette: PaletteName;
  setPalette: React.Dispatch<React.SetStateAction<PaletteName>>;
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
  c: ThemeColors;
  radius: number;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialPalette = 'forest',
}: {
  children: ReactNode;
  initialPalette?: PaletteName;
}) {
  const [palette, setPalette] = useState<PaletteName>(initialPalette);

  const systemScheme = useColorScheme();

  const [override, setOverride] = useState<boolean | null>(null);
  useEffect(() => {
    setOverride(null);
  }, [systemScheme]);

  const dark = override ?? systemScheme === 'dark';

  const setDark = useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (next) => {
      setOverride((prev) => (typeof next === 'function' ? next(prev ?? systemScheme === 'dark') : next));
    },
    [systemScheme],
  );

  const value = useMemo<ThemeContextValue>(() => {
    const c = PALETTES[palette][dark ? 'dark' : 'light'];
    return { palette, setPalette, dark, setDark, c, radius: RADIUS };
  }, [palette, dark, setDark]);

  // JSX-free so this file stays .ts (avoids a theme.ts / theme.tsx clash)
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/* --------------------- Expo template Colors / Fonts ---------------------- */
// Kept so the default template screens (tabs, themed-text/view, icon-symbol)
// that import { Colors, Fonts } from '@/constants/theme' keep working.

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
