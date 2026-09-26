// The glowing check-in shape: rings coloured red to green, spiky when low and round when
// high. `value` is a shared value from 1 to 5 moved by the slider.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { SCORE_TONES } from '@/components/mood-art';
import { useReducedMotion } from '@/components/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const SCORES = [1, 2, 3, 4, 5];
const TONES = [...SCORE_TONES];
const POINTS = 72;
const TAU = Math.PI * 2;

// Outline of one ring: a circle bent by three waves. Low scores weigh the sharp
// nine-lobed wave, high scores the gentle five-lobed one.
const ringPath = (center: number, radius: number, value: number, phase: number): string => {
  'worklet';
  const t = Math.min(1, Math.max(0, (value - 1) / 4));
  const soft = 0.025 + 0.045 * t;
  const sharp = 0.09 * (1 - t);
  let d = '';
  for (let i = 0; i <= POINTS; i++) {
    const angle = (i / POINTS) * TAU;
    const r =
      radius *
      (1 +
        soft * Math.sin(5 * angle + phase) +
        sharp * Math.sin(9 * angle - 1.4 * phase) +
        0.02 * Math.sin(3 * angle + 0.7 * phase));
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `${d}Z`;
};

/** A ring of the blob. Inner rings are brighter and more solid. */
function Ring({
  value,
  phase,
  center,
  radius,
  offset,
  fillOpacity,
  lighten,
}: {
  value: SharedValue<number>;
  phase: SharedValue<number>;
  center: number;
  radius: number;
  offset: number;
  fillOpacity: number;
  lighten: number;
}) {
  const props = useAnimatedProps(() => {
    const tone = interpolateColor(value.value, SCORES, TONES);
    return {
      d: ringPath(center, radius, value.value, phase.value + offset),
      fill: interpolateColor(lighten, [0, 1], [tone, '#FFFFFF']),
    };
  });
  return (
    <AnimatedPath
      animatedProps={props}
      fillOpacity={fillOpacity}
      stroke="#FFFFFF"
      strokeOpacity={0.55}
      strokeWidth={1.5}
    />
  );
}

export function MoodBlob({ value, size }: { value: SharedValue<number>; size: number }) {
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    phase.value = 0;
    phase.value = withRepeat(withTiming(TAU, { duration: 9000, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(phase);
      cancelAnimation(breathe);
    };
  }, [reduced, phase, breathe]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.97 + breathe.value * 0.05 }, { rotate: `${(phase.value / TAU) * 40}deg` }],
  }));
  const glow = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(value.value, SCORES, TONES),
    opacity: 0.22 + breathe.value * 0.08,
    transform: [{ scale: 0.9 + breathe.value * 0.08 }],
  }));

  const center = size / 2;
  const edge = center / 1.13;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[{ position: 'absolute', width: size * 0.9, height: size * 0.9, borderRadius: size }, glow]}
      />
      <Animated.View style={style}>
        <Svg width={size} height={size}>
          <Ring value={value} phase={phase} center={center} radius={edge} offset={0} fillOpacity={0.14} lighten={0} />
          <Ring value={value} phase={phase} center={center} radius={edge * 0.78} offset={0.9} fillOpacity={0.28} lighten={0.1} />
          <Ring value={value} phase={phase} center={center} radius={edge * 0.56} offset={1.8} fillOpacity={0.55} lighten={0.25} />
          <Ring value={value} phase={phase} center={center} radius={edge * 0.34} offset={2.7} fillOpacity={0.9} lighten={0.5} />
        </Svg>
      </Animated.View>
    </View>
  );
}
