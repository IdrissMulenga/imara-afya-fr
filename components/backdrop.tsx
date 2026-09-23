// Background circles: soft radial glows plus hairline rings, drawn in one static Svg.
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/theme';

// Brand green (the logo's right half) and brand blue (its left).
const GREEN = '#2EA34C';
const BLUE = '#1B5AAE';
const BLUE_DARK = '#5B9BE8';

export function AuthBackdrop() {
  const { isDark } = useTheme();
  const { width, height } = useWindowDimensions();

  // Glow strength per theme.
  const glow = isDark ? 0.34 : 0.2;
  const ring = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(19,35,58,0.085)';
  const blue = isDark ? BLUE_DARK : BLUE;

  // Positions are fractions of the window.
  const w = (f: number) => width * f;
  const h = (f: number) => height * f;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="bdGreenTop" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={GREEN} stopOpacity={glow} />
          <Stop offset="55%" stopColor={GREEN} stopOpacity={glow * 0.42} />
          <Stop offset="100%" stopColor={GREEN} stopOpacity={0} />
        </RadialGradient>

        <RadialGradient id="bdBlueMid" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={blue} stopOpacity={glow * 0.9} />
          <Stop offset="55%" stopColor={blue} stopOpacity={glow * 0.38} />
          <Stop offset="100%" stopColor={blue} stopOpacity={0} />
        </RadialGradient>

        <RadialGradient id="bdGreenLow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={GREEN} stopOpacity={glow * 0.8} />
          <Stop offset="55%" stopColor={GREEN} stopOpacity={glow * 0.34} />
          <Stop offset="100%" stopColor={GREEN} stopOpacity={0} />
        </RadialGradient>

        <RadialGradient id="bdBlueFoot" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={blue} stopOpacity={glow} />
          <Stop offset="55%" stopColor={blue} stopOpacity={glow * 0.4} />
          <Stop offset="100%" stopColor={blue} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Circle cx={w(1.02)} cy={h(0.23)} r={w(0.46)} fill="url(#bdGreenTop)" />

      <Circle cx={w(-0.06)} cy={h(0.46)} r={w(0.44)} fill="url(#bdBlueMid)" />

      <Circle cx={w(0.95)} cy={h(0.7)} r={w(0.34)} fill="url(#bdGreenLow)" />

      <Circle cx={w(0.2)} cy={h(1.04)} r={w(0.48)} fill="url(#bdBlueFoot)" />

      {/* Hairline rings. vectorEffect keeps the stroke 1px at any scale. */}
      <Circle
        cx={w(0.18)}
        cy={h(0.3)}
        r={w(0.3)}
        fill="none"
        stroke={ring}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <Circle
        cx={w(0.86)}
        cy={h(0.47)}
        r={w(0.22)}
        fill="none"
        stroke={ring}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <Circle
        cx={w(0.4)}
        cy={h(0.82)}
        r={w(0.38)}
        fill="none"
        stroke={ring}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}
