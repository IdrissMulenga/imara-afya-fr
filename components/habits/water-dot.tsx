// components/habits/water-dot.tsx — one glass of water.
// Pops when it fills so the tap feels like it landed.
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function WaterDot({
  filled,
  fillColor,
  emptyColor,
  // staggers the initial fill so a full day cascades instead of flashing
  index = 0,
  size = 17,
}: {
  filled: boolean;
  fillColor: string;
  emptyColor: string;
  index?: number;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    if (filled) {
      progress.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
      // the pop only reads if it happens after the colour lands
      scale.value = withDelay(
        index * 45,
        withSequence(
          withSpring(1.35, { damping: 9, stiffness: 340 }),
          withSpring(1, { damping: 16, stiffness: 240 }),
        ),
      );
    } else {
      progress.value = withTiming(0, { duration: 160 });
      scale.value = withTiming(1, { duration: 160 });
    }
  }, [filled, index, progress, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: progress.value > 0.5 ? fillColor : emptyColor,
    opacity: 0.45 + progress.value * 0.55,
  }));

  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />
  );
}
