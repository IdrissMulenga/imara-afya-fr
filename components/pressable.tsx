// Pressable with each phone's own touch feedback: a Material ripple on Android, clipped to
// the view's rounded corners; on iOS each control dims or shrinks itself as before.
import React from 'react';
import {
  Pressable as NativePressable,
  Platform,
  StyleSheet,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/theme';

type Props = PressableProps & {
  ref?: React.Ref<View>;
  /** light: on a coloured surface. borderless: a small icon or text button. */
  ripple?: 'default' | 'light' | 'borderless' | 'none';
};

// Rounded views clip the ripple so it follows their corners.
const clip = (style: StyleProp<ViewStyle>): StyleProp<ViewStyle> =>
  StyleSheet.flatten(style)?.borderRadius != null ? [style, { overflow: 'hidden' }] : style;

export function Pressable({ ripple = 'default', style, android_ripple, ...rest }: Props) {
  const { isDark } = useTheme();

  if (Platform.OS !== 'android' || ripple === 'none') {
    return <NativePressable style={style} android_ripple={android_ripple} {...rest} />;
  }

  const onColour = ripple === 'light' || isDark;
  const config = android_ripple ?? {
    color: onColour ? 'rgba(255,255,255,0.2)' : 'rgba(19,35,58,0.12)',
    foreground: ripple !== 'borderless',
    borderless: ripple === 'borderless',
  };
  const clipped =
    typeof style === 'function'
      ? (state: PressableStateCallbackType) => clip(style(state))
      : clip(style);

  return <NativePressable style={clipped} android_ripple={config} {...rest} />;
}
