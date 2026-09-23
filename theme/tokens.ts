// Colours, sizes and font names.

export const font = {
  display: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
} as const;

// The welcome screen uses this blue in both themes.
export const welcome = {
  bg: '#0F3A72',
  glow: 'rgba(46,163,76,0.6)',
  ring: 'rgba(227,239,239,0.22)',
  ink: '#F6F7F9',
  inkSoft: 'rgba(247,245,240,0.72)',
  inkFaint: 'rgba(247,245,240,0.5)',
  inkDim: 'rgba(247,245,240,0.45)',
  onWhite: '#1B5AAE',
  outline: 'rgba(247,245,240,0.3)',
} as const;

type Palette = {
  bg: string;
  surface: string;
  field: string;
  text: string;
  muted: string;
  faint: string;
  placeholder: string;
  border: string;
  borderStrong: string;
  primary: string;
  onPrimary: string;
  primaryPress: string;
  success: string;
  successMark: string;
  danger: string;
  dangerBg: string;
  track: string;
  overlay: string;
};

export const light: Palette = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  field: '#FFFFFF',
  text: '#13233A',
  muted: '#5C6B7F',
  faint: '#46566C',
  placeholder: '#67758A',
  border: '#AFB9C6',
  borderStrong: '#8794A5',
  primary: '#1B5AAE',
  onPrimary: '#FFFFFF',
  primaryPress: '#144586',
  success: '#1F7F3C',
  successMark: '#2EA34C',
  danger: '#B3261E',
  dangerBg: '#FCECEA',
  track: '#E4E8EE',
  overlay: 'rgba(19,35,58,0.45)',
};

// Dark palette. Text meets 7:1 contrast (body) and 4.5:1 (secondary), including on Glass cards.
export const dark: Palette = {
  bg: '#08090B',
  surface: '#121317',
  field: '#17191D',
  text: '#EDEEF1',
  muted: '#9CA2AC',
  faint: '#8B919B',
  placeholder: '#7C828C',
  border: 'rgba(255,255,255,0.13)',
  borderStrong: 'rgba(255,255,255,0.26)',
  primary: '#5B9BE8',
  onPrimary: '#06152B',
  primaryPress: '#7FB2EF',
  success: '#46D164',
  successMark: '#32BC4C',
  danger: '#FF8F85',
  dangerBg: 'rgba(255,143,133,0.12)',
  track: '#23252A',
  overlay: 'rgba(0,0,0,0.7)',
};

export type Theme = Palette;

export const radius = { field: 16, button: 16, card: 18, chip: 12 } as const;

export const size = {
  control: 54,
  field: 54,
  tap: 44,
  otpBox: 58,
  gutter: 28,
} as const;

export const type = {
  h1: { fontFamily: font.display, fontSize: 40, lineHeight: 42, letterSpacing: -1 },
  h2: { fontFamily: font.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  sub: { fontFamily: font.body, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 1.3 },
  input: { fontFamily: font.bodyMedium, fontSize: 16 },
  button: { fontFamily: font.bodySemi, fontSize: 15 },
  body: { fontFamily: font.body, fontSize: 14, lineHeight: 21 },
  fine: { fontFamily: font.body, fontSize: 12, lineHeight: 18 },
} as const;
