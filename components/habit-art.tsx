// Animated artwork for water and sleep: a glass that fills with a moving wave, and a
// floating moon with twinkling stars inside a progress ring. Transforms and opacity
// only (native thread); still when the OS "reduce motion" setting is on.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressRing } from '@/components/steps-ring';
import { useReducedMotion } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';

export const WATER_COLOR = '#3B9BF0';
export const SLEEP_COLOR = '#7B61D9';
const SLEEP_COLOR_TO = '#4C8DF6';
const MOON_COLOR = '#F5C84C';
const WAVE_HEIGHT = 8;

// Two wave periods per `width`, drawn across 2 × width, so shifting it left by
// `width` lands on an identical shape and the loop is seamless.
const wavePath = (width: number, height: number): string => {
  const half = width / 2;
  let d = `M0 ${height / 2}`;
  for (let i = 0; i < 4; i++) {
    const x = i * half;
    d += ` Q ${x + half / 2} ${i % 2 === 0 ? 0 : height} ${x + half} ${height / 2}`;
  }
  return `${d} L ${width * 2} ${height} L 0 ${height} Z`;
};

/** A glass filled to `fill` (0..1), with a wave moving across the surface. */
export function WaterGlass({ fill, width, height }: { fill: number; width: number; height: number }) {
  const { c, isDark } = useTheme();
  const reduced = useReducedMotion();
  const target = Math.max(0, Math.min(1, fill));

  const level = useSharedValue(0);
  useEffect(() => {
    level.value = reduced ? target : withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [target, reduced, level]);

  const wave = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    wave.value = 0;
    wave.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(wave);
  }, [reduced, wave]);

  // A small bob when a glass is added.
  const bob = useSharedValue(1);
  const previous = useRef(target);
  useEffect(() => {
    if (target > previous.current && !reduced) {
      bob.value = withSequence(withTiming(1.08, { duration: 130 }), withSpring(1));
    }
    previous.current = target;
  }, [target, reduced, bob]);

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: height * (1 - level.value) }] }));
  const waveStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -width * wave.value }] }));
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ scale: bob.value }] }));

  return (
    <Animated.View style={bobStyle}>
      <View
        style={[
          styles.glass,
          {
            width,
            height,
            borderBottomLeftRadius: width * 0.3,
            borderBottomRightRadius: width * 0.3,
            borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(59,155,240,0.45)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(59,155,240,0.07)',
          },
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
          <Animated.View
            style={[{ position: 'absolute', top: -WAVE_HEIGHT + 1, left: 0, width: width * 2, height: WAVE_HEIGHT }, waveStyle]}
          >
            <Svg width={width * 2} height={WAVE_HEIGHT}>
              <Path d={wavePath(width, WAVE_HEIGHT)} fill={WATER_COLOR} />
            </Svg>
          </Animated.View>
          <View style={{ flex: 1, backgroundColor: WATER_COLOR }} />
        </Animated.View>
        <View
          style={[styles.shine, { left: width * 0.16, top: height * 0.14, height: height * 0.46, backgroundColor: c.onPrimary }]}
        />
      </View>
    </Animated.View>
  );
}

// One star that fades in and out on its own rhythm.
function Star({ size, delay, style }: { size: number; delay: number; style: object }) {
  const reduced = useReducedMotion();
  const glow = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    glow.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(0.25, { duration: 900 }), withTiming(1, { duration: 900 })), -1, false),
    );
    return () => cancelAnimation(glow);
  }, [reduced, delay, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.8 + glow.value * 0.2 }] }));
  return (
    <Animated.View style={[{ position: 'absolute' }, style, glowStyle]}>
      <MaterialCommunityIcons name="star-four-points" size={size} color={MOON_COLOR} />
    </Animated.View>
  );
}

/** A crescent moon floating gently, with stars around it. */
export function Moon({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    float.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(float);
  }, [reduced, float]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 + float.value * 6 }, { rotate: `${-8 + float.value * 8}deg` }],
  }));

  const box = size * 1.6;
  return (
    <View style={{ width: box, height: box * 0.8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={floatStyle}>
        <MaterialCommunityIcons name="moon-waning-crescent" size={size} color={MOON_COLOR} />
      </Animated.View>
      <Star size={size * 0.28} delay={0} style={{ top: 0, right: box * 0.12 }} />
      <Star size={size * 0.2} delay={500} style={{ bottom: box * 0.06, right: 0 }} />
      <Star size={size * 0.22} delay={1000} style={{ top: box * 0.14, left: box * 0.02 }} />
    </View>
  );
}

/** Sleep against the goal: a violet ring with the moon, hours and goal inside. */
export function SleepRing({
  hours,
  goal,
  size,
  stroke,
  showGoal = true,
  moonOnly = false,
}: {
  hours: number;
  goal: number;
  size: number;
  stroke: number;
  showGoal?: boolean;
  /** Only the moon inside the ring (the hours are shown elsewhere). */
  moonOnly?: boolean;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  return (
    <ProgressRing
      progress={goal > 0 ? hours / goal : 0}
      size={size}
      stroke={stroke}
      from={SLEEP_COLOR}
      to={SLEEP_COLOR_TO}
      label={`${hours} ${a.of} ${goal} ${a.hours}`}
    >
      <Moon size={Math.round(size * (moonOnly ? 0.3 : 0.2))} />
      {moonOnly ? null : (
        <Text style={{ fontFamily: font.displayBold, fontSize: Math.round(size * 0.16), color: c.text }}>
          {hours.toLocaleString()} h
        </Text>
      )}
      {showGoal && !moonOnly ? (
        <Text style={[T.fine, { color: c.muted }]}>
          {a.of} {goal.toLocaleString()} {a.hours}
        </Text>
      ) : null}
    </ProgressRing>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderWidth: 2,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
  },
  shine: { position: 'absolute', width: 4, borderRadius: 2, opacity: 0.5 },
});
