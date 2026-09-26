// 1-5 slider whose knob is the animated face or battery; settles on the nearest score.
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { EnergyBattery, MoodFace } from '@/components/mood-art';
import { useTheme } from '@/theme/theme';
import { font } from '@/theme/tokens';

const KNOB = 60;
const TRACK = 64;
const INSET = (TRACK - KNOB) / 2;

export function ScoreSlider({
  kind,
  value,
  score,
  onScore,
  lowLabel,
  highLabel,
  accessibilityLabel,
}: {
  kind: 'mood' | 'energy';
  value: SharedValue<number>;
  score: number;
  onScore: (score: number) => void;
  lowLabel: string;
  highLabel: string;
  accessibilityLabel: string;
}) {
  const { c, isDark } = useTheme();
  const [width, setWidth] = useState(0);

  // Latest values for the gesture handlers, which are created once.
  const latest = useRef({ width, score, onScore });
  latest.current = { width, score, onScore };

  const toValue = (x: number) => {
    const travel = Math.max(1, latest.current.width - KNOB - INSET * 2);
    return 1 + 4 * Math.min(1, Math.max(0, (x - INSET - KNOB / 2) / travel));
  };
  const follow = (x: number) => {
    const next = toValue(x);
    value.value = next;
    const rounded = Math.round(next);
    if (rounded !== latest.current.score) {
      latest.current.score = rounded;
      Haptics.selectionAsync().catch(() => {});
      latest.current.onScore(rounded);
    }
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => follow(e.nativeEvent.locationX),
      onPanResponderMove: (e) => follow(e.nativeEvent.locationX),
      onPanResponderRelease: () => {
        value.value = withSpring(latest.current.score, { damping: 14, stiffness: 180 });
      },
      onPanResponderTerminate: () => {
        value.value = withSpring(latest.current.score, { damping: 14, stiffness: 180 });
      },
    }),
  ).current;

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ((value.value - 1) / 4) * Math.max(0, width - KNOB - INSET * 2) }],
  }));

  return (
    <View style={{ gap: 10 }}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(19,35,58,0.08)' }]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 1, max: 5, now: score }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const next = Math.min(5, Math.max(1, score + (e.nativeEvent.actionName === 'increment' ? 1 : -1)));
          value.value = withSpring(next);
          onScore(next);
        }}
        {...responder.panHandlers}
      >
        <Animated.View pointerEvents="none" style={[styles.knob, { backgroundColor: c.surface }, knobStyle]}>
          {kind === 'mood' ? <MoodFace score={score} size={KNOB - 8} /> : <EnergyBattery score={score} size={KNOB - 14} />}
        </Animated.View>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: c.faint }]} numberOfLines={1}>
          {lowLabel.toUpperCase()}
        </Text>
        <Text style={[styles.label, { color: c.faint, textAlign: 'right' }]} numberOfLines={1}>
          {highLabel.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: TRACK, borderRadius: TRACK / 2, justifyContent: 'center', paddingHorizontal: INSET },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  label: { fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 0.8, flex: 1 },
});
