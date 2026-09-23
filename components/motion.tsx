// Shared animation hooks and components. Only opacity and transform are animated, so everything runs on the native thread.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, AccessibilityInfo, type ViewStyle } from 'react-native';

// Whether the OS "reduce motion" setting is on.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => {
        if (alive) setReduced(on);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

// Fades content in with a small upward drift.
export function FadeIn({
  children,
  delay = 0,
  from = 10,
  duration = 320,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  /** How far below its resting place it starts, in points. Negative = above. */
  from?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }

    const run = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    run.start();
    return () => run.stop();
  }, [progress, delay, duration, reduced]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Short horizontal shake for a rejected field. Skipped under reduced motion.
export function useShake() {
  const offset = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  const shake = useCallback(() => {
    if (reduced) return;
    offset.setValue(0);
    Animated.sequence([
      Animated.timing(offset, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(offset, { toValue: -5, duration: 60, useNativeDriver: true }),
      Animated.timing(offset, { toValue: 3, duration: 60, useNativeDriver: true }),
      Animated.timing(offset, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  }, [offset, reduced]);

  return { shake, style: { transform: [{ translateX: offset }] } };
}

// Spring scale for press feedback.
export function usePressScale(to = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;

  const run = useCallback(
    (value: number) => {
      Animated.spring(scale, {
        toValue: value,
        speed: 45,
        bounciness: 5,
        useNativeDriver: true,
      }).start();
    },
    [scale],
  );

  return {
    onPressIn: () => run(to),
    onPressOut: () => run(1),
    style: { transform: [{ scale }] },
  };
}

// Animates an overlay's opacity between 0 and 1.
export function useFade(on: boolean, duration = 160) {
  const value = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    const run = Animated.timing(value, {
      toValue: on ? 1 : 0,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [on, value, duration]);

  return value;
}

// Pop-in scale for a tick or a code digit.
export function usePop(on: boolean) {
  const value = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    const run = on
      ? Animated.spring(value, { toValue: 1, speed: 50, bounciness: 10, useNativeDriver: true })
      : Animated.timing(value, { toValue: 0, duration: 110, useNativeDriver: true });

    run.start();
    return () => run.stop();
  }, [on, value]);

  return { opacity: value, transform: [{ scale: value }] };
}

// Blinking caret for an empty code box.
export function useBlink(on: boolean) {
  const value = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!on || reduced) {
      value.setValue(on ? 1 : 0);
      return;
    }

    value.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 0, duration: 420, delay: 80, useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 420, delay: 80, useNativeDriver: true }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [on, value, reduced]);

  return value;
}
