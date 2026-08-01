// components/motion.tsx — shared animation primitives.
//
// Two things, used everywhere:
//   <FadeIn index={i}>      cards and list rows drift up as the screen settles
//   <PressableScale>        buttons and cards dip slightly under a finger
//
// Kept deliberately small and quick. Entry-level Android is the target device,
// so every animation here runs on the UI thread via Reanimated and none of them
// last long enough to sit between the user and their data.
import { type ReactNode } from 'react';
import {
  Pressable,
  type LayoutChangeEvent,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ------------------------------- timings -------------------------------- */

// one place to tune the feel of the whole app
export const MOTION = {
  // how long each item takes to fade up
  duration: 320,
  // gap between consecutive items in a staggered list
  stagger: 55,
  // how far below its resting place an item starts
  offset: 14,
  // press feedback
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 260, mass: 0.6 },
} as const;

/* -------------------------------- FadeIn -------------------------------- */

/**
 * Fades a block up into place. Pass `index` inside a list and each row waits
 * its turn, which reads as one movement instead of everything snapping at once.
 */
export function FadeIn({
  children,
  index = 0,
  style,
  // set false for content that changes often — re-running the entry animation
  // on every data refresh is distracting
  animate = true,
  // passed through so callers can measure the block (e.g. to scroll a focused
  // input clear of the keyboard)
  onLayout,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  if (!animate) {
    return (
      <Animated.View style={style} onLayout={onLayout}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={style}
      onLayout={onLayout}
      entering={FadeInDown.delay(index * MOTION.stagger)
        .duration(MOTION.duration)
        .withInitialValues({ transform: [{ translateY: MOTION.offset }] })}
      // rows slide rather than jump when one above them is removed
      layout={LinearTransition.duration(220)}
    >
      {children}
    </Animated.View>
  );
}

/* ---------------------------- PressableScale ---------------------------- */

/**
 * A Pressable that dips under the finger. Use for cards and primary buttons —
 * anywhere the flat `opacity` press state felt dead.
 */
export function PressableScale({
  children,
  style,
  disabled,
  scaleTo = MOTION.pressScale,
  ...rest
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
} & Omit<PressableProps, 'style'>) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, MOTION.spring);
        opacity.value = withTiming(0.9, { duration: 90 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, MOTION.spring);
        opacity.value = withTiming(1, { duration: 140 });
        rest.onPressOut?.(e);
      }}
      style={[style, animatedStyle, disabled && { opacity: 0.55 }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/* ------------------------------- CountUp -------------------------------- */

/**
 * Animates a number changing — used for the water count and the days-until
 * figure, where a value that jumps silently is easy to miss.
 */
export function useAnimatedNumberStyle(value: number) {
  const scale = useSharedValue(1);

  // a quick pop whenever the value moves
  const bump = () => {
    scale.value = withSpring(1.12, { damping: 10, stiffness: 320 }, () => {
      scale.value = withSpring(1, MOTION.spring);
    });
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return { style, bump, value };
}

/* ------------------------------ ProgressBar ----------------------------- */

/**
 * A width-animated bar. Kept here so the easing matches everything else.
 */
export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 8,
}: {
  // 0 to 1
  progress: number;
  color: string;
  trackColor: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, progress));

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clamped * 100}%`, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    }),
  }));

  return (
    <Animated.View
      style={{ height, borderRadius: height / 2, backgroundColor: trackColor, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, animatedStyle]} />
    </Animated.View>
  );
}

export default FadeIn;
