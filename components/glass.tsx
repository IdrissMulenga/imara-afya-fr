// Frosted panel: real blur on iOS, a translucent fill with a hairline edge on Android
// (blur is too slow on low-end phones).
import React from 'react';
import { View, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme/theme';
import { radius } from '@/theme/tokens';

type Tone = 'light' | 'dark';

export function Glass({
  children,
  tone,
  intensity = 24,
  style,
  radius: r = radius.card,
  force = false,
  /** Add an outline. */
  bordered = false,
  /** No shadow (for a panel inside another surface). */
  flat = false,
}: {
  children?: React.ReactNode;
  /** Which surface it sits on. Defaults to the current theme. */
  tone?: Tone;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Use a real blur on Android too. */
  force?: boolean;
  bordered?: boolean;
  flat?: boolean;
}) {
  const { isDark } = useTheme();
  const onDark = tone ? tone === 'dark' : isDark;

  const skin: ViewStyle = {
    borderRadius: r,
    ...(bordered
      ? {
          borderWidth: 1,
          borderColor: onDark ? 'rgba(255,255,255,0.18)' : 'rgba(19,35,58,0.10)',
        }
      : null),
    overflow: 'hidden',
  };

  // Shadow in light mode on iOS only, on a wrapper because the panel clips its children.
  const lift = !flat && !onDark && Platform.OS === 'ios';

  const useRealBlur = Platform.OS === 'ios' || force;

  const inner = useRealBlur ? (
    <BlurView intensity={intensity} tint={onDark ? 'dark' : 'light'} style={[skin, style]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: onDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.62)' },
        ]}
        pointerEvents="none"
      />
      {children}
    </BlurView>
  ) : (
    <View
      style={[
        skin,
        {
          backgroundColor: onDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
          ...(bordered || flat
            ? null
            : {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: onDark ? 'rgba(255,255,255,0.12)' : 'rgba(19,35,58,0.08)',
              }),
        },
        style,
      ]}
    >
      <View
        style={[
          styles.sheen,
          { backgroundColor: onDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)' },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );

  if (!lift) return inner;

  return (
    <View
      style={[
        { borderRadius: r },
        styles.shadowIOS,
      ]}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  sheen: { position: 'absolute', top: 0, left: 1, right: 1, height: 1 },
  shadowIOS: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
});
