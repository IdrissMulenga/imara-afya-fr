// components/swipe-back.tsx — drag from the left edge to go back.
//
// WHY THIS ISN'T JUST A NAVIGATOR OPTION.
//
// Two reasons the built-in gesture can't do this for us:
//
//   1. `gestureEnabled` on a native stack is iOS-only — react-native-screens
//      documents it that way, and Android is our first platform.
//   2. Records / Profile / Password live inside the Tabs navigator
//      (registered with `href: null`). Tab navigators have no back gesture on
//      either platform, because there is no stack to pop.
//
// So this drives the transition itself and calls router.back() at the end,
// which works the same on both platforms and inside any navigator.
import { useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router, useFocusEffect } from 'expo-router';

import { useTheme } from '@/constants/theme';

import type { ReactNode } from 'react';

// How far in from the left edge the drag has to start. iOS uses roughly this,
// and keeping it narrow is what stops the gesture stealing from horizontal
// scrollers — the filter row on Find care sits just inside it.
const EDGE_WIDTH = 30;

// Past this fraction of the screen, letting go completes the back navigation
// rather than snapping home.
const DISMISS_RATIO = 0.35;

// A committed flick should go back even if it never travelled far.
const DISMISS_VELOCITY = 800;

export default function SwipeBack({
  children,
  enabled = true,
  style,
}: {
  children: ReactNode;
  enabled?: boolean;
  style?: ViewStyle;
}) {
  const { width } = useWindowDimensions();
  const { c } = useTheme();

  const x = useSharedValue(0);

  // Runs on the JS thread once the screen has slid off. There isn't always
  // somewhere to go — a deep link straight into this screen leaves no history —
  // and in that case the screen has to come back, or the user is left staring
  // at an empty page with the content parked off-screen.
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    x.value = withTiming(0, { duration: 180 });
  }, [x]);

  // Tab screens stay mounted after their first visit, so a screen dismissed by
  // this gesture is still sitting at translateX = width. Without this reset it
  // would be invisible the next time it is opened.
  useFocusEffect(
    useCallback(() => {
      x.value = 0;
    }, [x]),
  );

  const pan = Gesture.Pan()
    .enabled(enabled)
    // only recognise drags that begin at the left edge
    .hitSlop({ left: 0, width: EDGE_WIDTH })
    // don't claim the gesture until it is clearly horizontal...
    .activeOffsetX(12)
    // ...and give up entirely if it turns out to be a vertical scroll
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      // never let the screen be dragged past its resting position
      x.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      const far = e.translationX > width * DISMISS_RATIO;
      const fast = e.velocityX > DISMISS_VELOCITY;

      if (far || fast) {
        // see it off the edge first, then navigate — popping mid-slide looks
        // like the screen vanished rather than moved
        x.value = withTiming(width, { duration: 180 }, (finished) => {
          if (finished) runOnJS(goBack)();
        });

        return;
      }

      x.value = withSpring(0, { damping: 22, stiffness: 220 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    // Only shadow it while it is actually moving. Left on permanently, the
    // elevation would draw a faint line along the screen edges at rest.
    const lifted = x.value > 0;

    return {
      transform: [{ translateX: x.value }],
      shadowOpacity: lifted ? 0.18 : 0,
      elevation: lifted ? 12 : 0,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      {/* BACKDROP.
          As the card slides right it uncovers whatever sits behind it, and
          behind a tab screen there is nothing — so the navigator's own
          background showed through, which is white by default and flashed
          badly in dark mode. This fills that gap with the app background, so
          the only thing you see moving is the card and its shadow. */}
      <View style={[styles.fill, { backgroundColor: c.bg }]}>
        <Animated.View style={[styles.fill, styles.card, style, animatedStyle]}>
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // iOS reads shadowOffset/Radius, Android uses the animated elevation above
  card: {
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowRadius: 8,
  },
});
