// components/home/highlight-banner.tsx — the rotating card at the top of the
// dashboard.
//
// One large card showing the thing most worth acting on right now — water,
// a dose due, the next period — cycling every few seconds, swipeable by hand.
//
// WHEN IT STOPS ROTATING matters more than the rotation itself. Content that
// moves while you are trying to read it is worse than content that sits still,
// so it pauses:
//
//   • while a finger is on it, and for a while after — if she swiped, she is
//     reading, and yanking the card away mid-sentence is infuriating
//   • when the screen is not focused — no timers running behind other tabs
//   • when the phone has "reduce motion" turned on — an accessibility setting
//     that exists precisely for this, and some people get motion sick
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  View, Text, StyleSheet, ScrollView, AccessibilityInfo,
  useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { PressableScale, ProgressBar } from '@/components/motion';

export type Highlight = {
  key: string;
  title: string;
  /** the big number — kept as a string so callers can pass "—" */
  value: string;
  unit?: string;
  caption: string;
  /** 0..1, draws a bar under the caption when present */
  progress?: number;
  /** accent colour for the artwork and the bar */
  tint: string;
  art: ReactNode;
  onPress: () => void;
};

// Long enough to read a short sentence without hurrying.
const ROTATE_MS = 5000;

// After a manual swipe, wait this long before taking over again.
const RESUME_AFTER_MS = 10000;

// The dashboard body is inset by 22 on each side, and this card sits on the
// same line as everything below it. It was briefly full bleed and square, which
// made it read as a band welded to the header rather than as the first card in
// a stack — the rest of the screen is rounded cards with air around them, and
// one member of that stack behaving differently is what made it look wrong.
const PAGE_INSET = 22;

export default function HighlightBanner({ items }: { items: Highlight[] }) {
  const { c, radius } = useTheme();
  const { width } = useWindowDimensions();

  // PAGING SNAPS TO THE SCROLLER'S WIDTH, always — it cannot be told to snap
  // to anything else. So a page is the FULL screen width, and the inset lives
  // inside it as padding around the card. Padding the scroll container instead
  // looks identical on the first card and then drifts 44px further out of
  // alignment on every one after it.
  const pageWidth = width;

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  // set once we know the phone's accessibility preference
  const [reduceMotion, setReduceMotion] = useState(false);

  // true while the screen is on top; timers are pointless otherwise
  const focused = useRef(false);

  // when the user last touched the card — 0 means "never"
  const lastTouch = useRef(0);

  // `index` is read inside the interval, so keep a ref the timer can see
  // without having to be torn down and rebuilt on every tick
  const indexRef = useRef(0);
  indexRef.current = index;

  useEffect(() => {
    let alive = true;

    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (alive) setReduceMotion(on);
    });

    // people change this setting while apps are open
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;

      return () => {
        focused.current = false;
      };
    }, []),
  );

  useEffect(() => {
    // one card can't rotate, and reduce-motion means it shouldn't
    if (items.length < 2 || reduceMotion) return;

    const timer = setInterval(() => {
      if (!focused.current) return;

      // still within the grace period after a manual swipe
      if (Date.now() - lastTouch.current < RESUME_AFTER_MS) return;

      const next = (indexRef.current + 1) % items.length;

      scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
      setIndex(next);
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [items.length, pageWidth, reduceMotion]);

  // Keep the dots honest when the card is swiped by hand. Rounding rather than
  // flooring so a swipe that lands slightly short still counts as arrived.
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);

    setIndex(page);
  };

  if (!items.length) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onTouchStart={() => { lastTouch.current = Date.now(); }}
        // a swipe that ends without momentum still counts as "she is reading"
        onScrollEndDrag={() => { lastTouch.current = Date.now(); }}
        scrollEventThrottle={16}
      >
        {items.map((item) => (
          <View key={item.key} style={{ width: pageWidth, paddingHorizontal: PAGE_INSET }}>
          <PressableScale
            onPress={item.onPress}
            style={[
              styles.card,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                borderRadius: radius + 4,
              },
            ]}
          >
            <View style={styles.copy}>
              <Text style={[styles.title, { color: c.textMuted }]} numberOfLines={1}>
                {item.title}
              </Text>

              <View style={styles.valueRow}>
                <Text style={[styles.value, { color: c.text }]}>{item.value}</Text>
                {!!item.unit && (
                  <Text style={[styles.unit, { color: c.textMuted }]}>{item.unit}</Text>
                )}
              </View>

              <Text style={[styles.caption, { color: c.textMuted }]} numberOfLines={2}>
                {item.caption}
              </Text>

              {item.progress != null && (
                <View style={styles.bar}>
                  <ProgressBar
                    progress={item.progress}
                    color={item.tint}
                    trackColor={c.fieldBg}
                    height={7}
                  />
                </View>
              )}
            </View>

            <View style={styles.art}>{item.art}</View>
          </PressableScale>
          </View>
        ))}
      </ScrollView>

      {/* dots — only worth drawing when there is more than one card */}
      {items.length > 1 && (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View
              key={item.key}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? c.primary : c.borderStrong,
                  // the active dot stretches rather than just recolouring, so
                  // it still reads on a cheap screen in bright sunlight
                  width: i === index ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // the same 1px outline every other card on this screen has
    borderWidth: 1,
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 8,
    minHeight: 140,
  },
  copy: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 },
  value: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  unit: { fontSize: 15, fontWeight: '700' },
  caption: { fontSize: 12.5, fontWeight: '600', marginTop: 3, lineHeight: 17 },
  bar: { marginTop: 10, paddingRight: 6 },
  art: { width: 88, alignItems: 'center', justifyContent: 'center' },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },
});
