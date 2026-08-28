// components/glass-surface.tsx — Liquid Glass where the OS has it, a normal
// surface everywhere else.
//
// WHAT THIS IS FOR.
//
// iOS 26 introduced Liquid Glass: a translucent material that refracts whatever
// is behind it. expo-glass-effect exposes it, but only on iOS 26+ — on Android
// and older iPhones `GlassView` degrades to a plain transparent View, which
// would leave our tab bar and sheets with no background at all.
//
// So callers use this instead of branching on platform themselves. It renders
// real glass when real glass exists, and the themed solid surface when it
// doesn't. Android is byte-for-byte what it was before.
//
// WHERE GLASS IS WORTH USING: only over moving content. The whole effect is
// refraction, so on a flat background it looks like nothing at all — a tab bar
// with a scrolling list beneath it, or a sheet over a screen. Never card-on-card.
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { View, StyleSheet, AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/constants/theme';
import { TAB_BAR_HEIGHT } from '@/lib/layout';

// LOADED LAZILY, INSIDE A TRY/CATCH, AND THIS MATTERS.
//
// expo-glass-effect is a native module. Its iOS entry point calls
// `requireNativeViewManager('ExpoGlassEffect')` at the top level of the file —
// so merely IMPORTING it throws in any runtime where the native side isn't
// present. Expo Go is exactly that runtime.
//
// A plain `import` would therefore crash the app the moment this file is
// reached, and this file is imported by the tab layout and eight screens. So
// the whole signed-in area would die on launch in Expo Go, which is where the
// app is actually being tested day to day.
//
// require() rather than import so the failure is catchable, and once rather
// than per render.
let GlassViewImpl: ComponentType<any> | null = null;
let GLASS_SUPPORTED = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const glass = require('expo-glass-effect');

  // Whether the OS has the material at all. Can't change while the app runs,
  // unlike the accessibility setting below.
  GLASS_SUPPORTED = Boolean(glass?.isLiquidGlassAvailable?.());
  GlassViewImpl = glass?.GlassView ?? null;
} catch {
  // Expo Go, an older iOS, or Android. All of them mean the same thing here:
  // draw the ordinary themed surface instead.
  GLASS_SUPPORTED = false;
  GlassViewImpl = null;
}

/**
 * Does this device actually render glass right now?
 *
 * Two separate questions, and both have to be yes:
 *   • does the OS have the material at all
 *   • has the user asked for less transparency
 *
 * The second is a real accessibility setting that people turn on because
 * translucency makes text hard to read, or because motion and depth make them
 * unwell. Ignoring it is exactly the kind of thing that makes an app unusable
 * for someone while looking fine to everyone else.
 */
export function useGlassEnabled() {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (!GLASS_SUPPORTED) return;

    let alive = true;

    AccessibilityInfo.isReduceTransparencyEnabled().then((on) => {
      if (alive) setReduceTransparency(on);
    });

    // people change this while apps are open
    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return GLASS_SUPPORTED && !reduceTransparency;
}

/** True on iOS 26+, false on Android and older iOS. Safe to read at module level. */
export const glassSupported = GLASS_SUPPORTED;


/**
 * Extra bottom padding a scrolling screen needs.
 *
 * Glass only refracts what is behind it, so the tab bar has to become
 * `position: absolute` for the effect to exist at all — which means content now
 * scrolls UNDERNEATH it and the last item would be hidden. This gives that
 * height back as padding.
 *
 * Returns 0 when glass is off, so Android and older iPhones keep the layout
 * they already had.
 */
/**
 * HOW MUCH ROOM THE BOTTOM BAR NEEDS, on every platform.
 *
 * This used to return 0 unless iOS glass was on, because the bar was only
 * floating there and was a solid panel everywhere else — the navigator laid
 * that panel out and screens got the space for free. The bar is a floating
 * pill on Android too now, so content runs underneath it everywhere and every
 * screen has to give the height back as padding, or the last card in every
 * list sits behind it.
 */
export function useTabBarInset() {
  return TAB_BAR_HEIGHT;
}


export default function GlassSurface({
  children,
  style,
  radius,
  /** 'regular' is frosted; 'clear' is far more transparent and needs high contrast behind it */
  glassEffectStyle = 'regular',
  /** falls back to the theme surface colour when glass isn't available */
  fallbackColor,
  tintColor,
  /** glass that responds to touch — worth it on the tab bar, distracting on a sheet */
  isInteractive = false,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  glassEffectStyle?: 'regular' | 'clear';
  fallbackColor?: string;
  tintColor?: string;
  isInteractive?: boolean;
}) {
  const { c, dark } = useTheme();

  const enabled = useGlassEnabled();

  // The radius has to be on the view itself, not a parent — the native glass
  // layer clips to its own bounds and would otherwise square off the corners.
  const shape = radius != null ? { borderRadius: radius, overflow: 'hidden' as const } : null;

  // GlassViewImpl is null whenever the native module didn't load, which
  // `enabled` already covers — but checking both means a future change to one
  // can't produce a null render.
  if (!enabled || !GlassViewImpl) {
    return (
      <View style={[styles.fill, shape, { backgroundColor: fallbackColor ?? c.surface }, style]}>
        {children}
      </View>
    );
  }

  const Glass = GlassViewImpl;

  return (
    <Glass
      style={[styles.fill, shape, style]}
      glassEffectStyle={glassEffectStyle}
      tintColor={tintColor}
      isInteractive={isInteractive}
      // The app has its own light/dark toggle that doesn't have to agree with
      // the system. Left on 'auto' the glass would follow iOS while everything
      // around it followed us, which looks like a bug.
      colorScheme={dark ? 'dark' : 'light'}
    >
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
