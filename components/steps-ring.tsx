// Steps visuals: the animated progress ring and the dashboard's steps card with
// its decorative hills-and-footprints art.
import React, { useEffect, useId, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { useReducedMotion } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// An svg id that is unique on screen (useId contains characters url(#…) rejects).
const useSvgId = (prefix: string) => `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

/** Approximate distance in km for a step count (0.75 m per step). */
export const stepsToKm = (steps: number): string => (steps * 0.00075).toFixed(1);

/** An animated progress ring (0..1) with a gradient arc, a knob at its tip and
 *  content in the middle. */
export function ProgressRing({
  progress: target,
  size,
  stroke,
  from,
  to,
  label,
  children,
}: {
  progress: number;
  size: number;
  stroke: number;
  /** Gradient colours along the arc. */
  from: string;
  to: string;
  /** Accessibility label. */
  label: string;
  children?: React.ReactNode;
}) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const gradientId = useSvgId('ring');

  const center = size / 2;
  const radius = center - stroke / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, target));

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = reduced
      ? clamped
      : withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, reduced, progress]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));
  const knobProps = useAnimatedProps(() => {
    const angle = 2 * Math.PI * progress.value - Math.PI / 2;
    return { cx: center + radius * Math.cos(angle), cy: center + radius * Math.sin(angle) };
  });

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius + stroke / 2 + 5}
          stroke={c.border}
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="2 7"
          fill="none"
        />
        <Circle cx={center} cy={center} r={radius} stroke={c.track} strokeWidth={stroke} fill="none" />
        <G rotation={-90} origin={`${center}, ${center}`}>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={arcProps}
          />
        </G>
        <AnimatedCircle r={Math.max(2, stroke / 2 - 3)} fill="#FFFFFF" animatedProps={knobProps} />
      </Svg>

      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

/** Progress ring for steps against a goal. Animates as the count changes. */
export function StepsRing({
  steps,
  goal,
  size = 200,
  stroke = 16,
}: {
  steps: number;
  goal: number;
  size?: number;
  stroke?: number;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const reduced = useReducedMotion();

  // The icon pulses when steps go up.
  const pulse = useSharedValue(1);
  const previous = useRef(steps);
  useEffect(() => {
    if (steps > previous.current && !reduced) {
      pulse.value = withSequence(withTiming(1.18, { duration: 140 }), withSpring(1));
    }
    previous.current = steps;
  }, [steps, reduced, pulse]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const met = goal > 0 && steps >= goal;

  return (
    <ProgressRing
      progress={goal > 0 ? steps / goal : 0}
      size={size}
      stroke={stroke}
      from={c.primary}
      to={c.successMark}
      label={`${steps.toLocaleString()} ${a.of} ${goal.toLocaleString()} ${a.steps}`}
    >
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons
          name={met ? 'trophy-outline' : 'shoe-print'}
          size={Math.round(size * 0.13)}
          color={met ? c.success : c.primary}
        />
      </Animated.View>
      <Text style={{ fontFamily: font.displayBold, fontSize: Math.round(size * 0.17), color: c.text }}>
        {steps.toLocaleString()}
      </Text>
      <Text style={[T.fine, { color: c.muted }]}>
        {a.of} {goal.toLocaleString()} {a.steps}
      </Text>
    </ProgressRing>
  );
}

/** A small icon + value + caption, used beside the ring. */
export function MiniStat({
  icon,
  value,
  caption,
  tint,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  caption: string;
  tint?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.miniStat}>
      <MaterialCommunityIcons name={icon} size={18} color={tint ?? c.primary} />
      <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.text }}>{value}</Text>
      <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]} numberOfLines={1}>
        {caption}
      </Text>
    </View>
  );
}

// Decorative art behind the steps card: two soft hills and a trail of footprints.
function StepsArt({ width, height }: { width: number; height: number }) {
  const { c } = useTheme();
  const hillsId = useSvgId('stepsHills');
  const prints = [
    [0.08, 0.86, -20],
    [0.15, 0.8, 15],
    [0.23, 0.76, -15],
    [0.31, 0.73, 18],
    [0.72, 0.7, -12],
    [0.8, 0.73, 16],
    [0.88, 0.78, -18],
    [0.95, 0.84, 14],
  ] as const;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={hillsId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.successMark} stopOpacity={0.22} />
          <Stop offset="1" stopColor={c.successMark} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path
        d={`M0 ${height * 0.8} Q ${width * 0.3} ${height * 0.62} ${width * 0.55} ${height * 0.78} T ${width} ${height * 0.7} V ${height} H 0 Z`}
        fill={`url(#${hillsId})`}
      />
      <Path
        d={`M0 ${height * 0.9} Q ${width * 0.45} ${height * 0.74} ${width} ${height * 0.88} V ${height} H 0 Z`}
        fill={c.primary}
        fillOpacity={0.07}
      />
      {prints.map(([x, y, rotate], i) => (
        <Ellipse
          key={i}
          cx={width * x}
          cy={height * y}
          rx={4}
          ry={7}
          fill={c.primary}
          fillOpacity={0.14}
          rotation={rotate}
          origin={`${width * x}, ${height * y}`}
        />
      ))}
    </Svg>
  );
}

/** Dashboard card: the steps ring over the art, with streak, distance and progress. */
export function StepsHero({
  steps,
  goal,
  streakDays,
  onPress,
  footer,
}: {
  steps: number;
  goal: number;
  streakDays: number;
  onPress: () => void;
  /** Shown under the stats, e.g. the prompt to turn counting on. */
  footer?: React.ReactNode;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const [box, setBox] = React.useState({ width: 0, height: 0 });
  const percent = goal > 0 ? Math.min(999, Math.round((steps / goal) * 100)) : 0;

  return (
    <Glass style={{ padding: 0 }}>
      <View onLayout={(e) => setBox(e.nativeEvent.layout)}>
        {box.width > 0 ? <StepsArt width={box.width} height={box.height} /> : null}
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityHint={a.seeHistory}
          style={{ padding: 18, alignItems: 'center', gap: 14 }}
        >
          <StepsRing steps={steps} goal={goal} size={196} />
          <View style={styles.statsRow}>
            <MiniStat
              icon="fire"
              value={String(streakDays)}
              caption={a.streakLabel}
              tint={streakDays > 0 ? '#E8772E' : c.faint}
            />
            <MiniStat icon="map-marker-distance" value={`${stepsToKm(steps)} ${a.kmUnit}`} caption={a.distance} />
            <MiniStat icon="chart-arc" value={`${percent}%`} caption={a.ofGoal} tint={c.successMark} />
          </View>
        </Pressable>
        {footer ? <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>{footer}</View> : null}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  statsRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around' },
  miniStat: { alignItems: 'center', gap: 2, minWidth: 80 },
});
