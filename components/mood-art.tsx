// Animated check-in faces (mood) and batteries (energy), red (1) to green (5); still when
// "reduce motion" is on or `animate` is false.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useReducedMotion } from '@/components/motion';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Red for 1, through orange and amber, to green for 5. */
export const SCORE_TONES = ['#E5484D', '#F07A3A', '#F2B233', '#8BC34A', '#2FAF62'] as const;

/** The tone for a score, rounded to 1-5. */
export const scoreTone = (score: number): string =>
  SCORE_TONES[Math.min(5, Math.max(1, Math.round(score))) - 1];

const clampScore = (score: number) => Math.min(5, Math.max(1, Math.round(score)));

// Mouth for each mood, in a 100 × 100 face.
const MOUTHS = [
  'M32 72 Q50 54 68 72',
  'M35 69 Q50 61 65 69',
  'M36 66 L64 66',
  'M34 62 Q50 76 66 62',
  'M30 58 Q50 86 70 58 Z',
];

// How the whole face moves for each mood, from one looping value 0..1.
const faceMotion = (score: number, t: number, size: number) => {
  'worklet';
  const s = size / 100;
  switch (score) {
    case 1:
      return [{ translateX: Math.sin(t * Math.PI * 8) * 1.2 * s }, { translateY: 2 * s }];
    case 2:
      return [{ rotate: `${-4 + t * 4}deg` }, { translateY: t * 2 * s }];
    case 3:
      return [{ scale: 0.97 + t * 0.05 }];
    case 4:
      return [{ rotate: `${-6 + t * 12}deg` }];
    default:
      return [{ translateY: -t * 5 * s }, { rotate: `${-5 + t * 10}deg` }, { scale: 1 + t * 0.04 }];
  }
};

/** A round face for a mood score 1–5 that blinks and moves with the mood. */
export function MoodFace({
  score,
  size,
  animate = true,
  dim = false,
}: {
  score: number;
  size: number;
  animate?: boolean;
  /** Faded, for choices that are not selected. */
  dim?: boolean;
}) {
  const reduced = useReducedMotion();
  const level = clampScore(score);
  const tone = scoreTone(level);
  const moving = animate && !reduced;

  const loop = useSharedValue(0);
  const blink = useSharedValue(1);
  const tear = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    if (!moving) {
      loop.value = 0;
      blink.value = 1;
      tear.value = 0;
      return;
    }
    const speed = level === 1 ? 1600 : level === 5 ? 700 : 1400;
    loop.value = 0;
    loop.value = withRepeat(withTiming(1, { duration: speed, easing: Easing.inOut(Easing.sin) }), -1, true);
    blink.value = withRepeat(
      withSequence(
        withDelay(2400, withTiming(0.1, { duration: 80 })),
        withTiming(1, { duration: 120 }),
      ),
      -1,
      false,
    );
    if (level === 1) {
      tear.value = 0;
      tear.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.in(Easing.quad) }), -1, false);
    }
    pop.value = withSequence(withTiming(1.18, { duration: 120 }), withSpring(1, { damping: 7 }));
    return () => {
      cancelAnimation(loop);
      cancelAnimation(blink);
      cancelAnimation(tear);
    };
  }, [moving, level, loop, blink, tear, pop]);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [...faceMotion(level, loop.value, size), { scale: pop.value }],
  }));
  const eyeProps = useAnimatedProps(() => ({ ry: 6.5 * blink.value }));
  const tearStyle = useAnimatedStyle(() => ({
    opacity: tear.value < 0.85 ? 1 : (1 - tear.value) / 0.15,
    transform: [{ translateY: (tear.value * size) / 4 }],
  }));

  const eyeY = level <= 2 ? 44 : 40;
  const ink = '#2B1B12';

  return (
    <Animated.View style={[{ width: size, height: size, opacity: dim ? 0.4 : 1 }, faceStyle]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={46} fill={tone} />
        <Ellipse cx={38} cy={30} rx={16} ry={9} fill="#FFFFFF" opacity={0.22} />
        {level <= 2 ? (
          <G stroke={ink} strokeWidth={3.5} strokeLinecap="round">
            <Path d={level === 1 ? 'M26 32 L40 37' : 'M27 34 L40 35'} />
            <Path d={level === 1 ? 'M74 32 L60 37' : 'M73 34 L60 35'} />
          </G>
        ) : null}
        <AnimatedEllipse cx={36} cy={eyeY} rx={5.5} fill={ink} animatedProps={eyeProps} />
        <AnimatedEllipse cx={64} cy={eyeY} rx={5.5} fill={ink} animatedProps={eyeProps} />
        {level >= 4 ? (
          <G fill="#FF6B8A" opacity={0.45}>
            <Circle cx={24} cy={56} r={7} />
            <Circle cx={76} cy={56} r={7} />
          </G>
        ) : null}
        <Path
          d={MOUTHS[level - 1]}
          stroke={ink}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={level === 5 ? ink : 'none'}
        />
        {level === 5 ? <Path d="M40 72 Q50 80 60 72 Q50 76 40 72 Z" fill="#FF6B8A" /> : null}
      </Svg>
      {level === 1 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: size * 0.26,
              top: size * 0.5,
              width: size * 0.09,
              height: size * 0.13,
              borderRadius: size * 0.05,
              borderTopLeftRadius: size * 0.01,
              backgroundColor: '#6EC1FF',
            },
            tearStyle,
          ]}
        />
      ) : null}
    </Animated.View>
  );
}

// Battery drawn in a 60 × 100 box: cap on top, body below, fill rising from the bottom.
const BODY = { x: 6, y: 12, w: 48, h: 84, r: 10 };
const INNER = { x: 12, y: 18, w: 36, h: 72, r: 5 };

/** An upright battery for an energy score 1–5 whose charge rises to the level. */
export function EnergyBattery({
  score,
  size,
  animate = true,
  dim = false,
}: {
  score: number;
  /** Height; the width is 60% of it. */
  size: number;
  animate?: boolean;
  dim?: boolean;
}) {
  const reduced = useReducedMotion();
  const level = clampScore(score);
  const tone = scoreTone(level);
  const moving = animate && !reduced;
  const target = level / 5;

  const charge = useSharedValue(moving ? 0 : target);
  const pulse = useSharedValue(1);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!moving) {
      charge.value = target;
      pulse.value = 1;
      shake.value = 0;
      return;
    }
    charge.value = 0;
    charge.value = withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) });
    if (level === 1) {
      pulse.value = withRepeat(withSequence(withTiming(0.25, { duration: 450 }), withTiming(1, { duration: 450 })), -1, false);
    } else if (level === 5) {
      pulse.value = withRepeat(withSequence(withTiming(1.25, { duration: 420 }), withTiming(1, { duration: 420 })), -1, false);
    } else {
      pulse.value = withRepeat(withSequence(withTiming(0.7, { duration: 1100 }), withTiming(1, { duration: 1100 })), -1, false);
    }
    shake.value = withSequence(
      withTiming(1, { duration: 70 }),
      withTiming(-1, { duration: 70 }),
      withTiming(0.5, { duration: 70 }),
      withTiming(0, { duration: 70 }),
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [moving, level, target, charge, pulse, shake]);

  const fillProps = useAnimatedProps(() => {
    const h = INNER.h * charge.value;
    return { y: INNER.y + INNER.h - h, height: h };
  });
  const fillStyle = useAnimatedStyle(() => ({ opacity: level === 5 ? 1 : pulse.value }));
  const boltStyle = useAnimatedStyle(() => ({ transform: [{ scale: level === 5 ? pulse.value : 1 }] }));
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value * 6}deg` }] }));

  const width = size * 0.6;

  return (
    <Animated.View style={[{ width, height: size, opacity: dim ? 0.4 : 1 }, bodyStyle]}>
      <Svg width={width} height={size} viewBox="0 0 60 100" style={{ position: 'absolute' }}>
        <Rect x={21} y={3} width={18} height={10} rx={3} fill={tone} />
        <Rect
          x={BODY.x}
          y={BODY.y}
          width={BODY.w}
          height={BODY.h}
          rx={BODY.r}
          fill={`${tone}22`}
          stroke={tone}
          strokeWidth={5}
        />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width, height: size }, fillStyle]}>
        <Svg width={width} height={size} viewBox="0 0 60 100">
          <AnimatedRect x={INNER.x} width={INNER.w} rx={INNER.r} fill={tone} animatedProps={fillProps} />
        </Svg>
      </Animated.View>
      {level >= 4 ? (
        <View style={{ position: 'absolute', width, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ marginTop: size * 0.1 }, boltStyle]}>
            <Svg width={width * 0.5} height={size * 0.42} viewBox="0 0 24 40">
              <Path d="M14 0 L2 22 H11 L8 40 L22 15 H13 Z" fill="#FFFFFF" />
            </Svg>
          </Animated.View>
        </View>
      ) : null}
    </Animated.View>
  );
}
