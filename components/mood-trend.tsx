// Mood and energy trend: daily averages over 7 or 30 days as two lines coloured from
// red (1) to green (5), with a short insight about the week and the best time of day.
import React, { useEffect, useId, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { SCORE_TONES, scoreTone } from '@/components/mood-art';
import { useReducedMotion } from '@/components/motion';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import type { CheckInDay } from '@/graphql/checkin';

type Range = 7 | 30;

const HEIGHT = 170;
const PAD = { top: 12, bottom: 26, left: 22, right: 10 };

const addDays = (day: string, n: number): string => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const mean = (values: number[]) => values.reduce((t, v) => t + v, 0) / values.length;

const axisLabel = (day: string, range: Range, lang: Lang): string => {
  try {
    const date = new Date(`${day}T12:00:00Z`);
    const locale = lang === 'rn' ? 'fr' : lang;
    return range === 7
      ? date.toLocaleDateString(locale, { weekday: 'narrow', timeZone: 'UTC' })
      : date.toLocaleDateString(locale, { day: 'numeric', timeZone: 'UTC' });
  } catch {
    return day.slice(8);
  }
};

/** A sentence about this week against last week, and one about the best time of day. */
export function trendInsights(days: CheckInDay[], today: string, a: AppCopy): string[] {
  const inRange = (from: number, to: number) =>
    days.filter((d) => d.day <= addDays(today, -from) && d.day >= addDays(today, -to)).map((d) => d.mood);
  const thisWeek = inRange(0, 6);
  const lastWeek = inRange(7, 13);

  const lines: string[] = [];
  if (thisWeek.length >= 2 && lastWeek.length >= 2) {
    const diff = mean(thisWeek) - mean(lastWeek);
    lines.push(diff >= 0.3 ? a.trendUp : diff <= -0.3 ? a.trendDown : a.trendSteady);
  } else {
    lines.push(a.trendNotEnough);
  }

  // Morning 5–11, afternoon 12–17, evening otherwise, in the phone's local time.
  const buckets: Record<'morning' | 'afternoon' | 'evening', number[]> = { morning: [], afternoon: [], evening: [] };
  for (const day of days) {
    for (const entry of day.entries) {
      const hour = new Date(entry.at).getHours();
      buckets[hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening'].push(entry.mood);
    }
  }
  const ranked = (Object.entries(buckets) as [keyof typeof buckets, number[]][])
    .filter(([, moods]) => moods.length >= 2)
    .map(([name, moods]) => [name, mean(moods)] as const)
    .sort((x, y) => y[1] - x[1]);
  if (ranked.length >= 2 && ranked[0][1] - ranked[ranked.length - 1][1] >= 0.5) {
    lines.push({ morning: a.bestMorning, afternoon: a.bestAfternoon, evening: a.bestEvening }[ranked[0][0]]);
  }
  return lines;
}

// Path through the points, broken where a day has no check-in.
const linePath = (points: ({ x: number; y: number } | null)[]): string => {
  let d = '';
  let open = false;
  for (const p of points) {
    if (!p) {
      open = false;
      continue;
    }
    d += `${open ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    open = true;
  }
  return d.trim();
};

/** The trend card: a 7/30-day switch, the chart, a legend and the insights. */
export function MoodTrend({ days, today }: { days: CheckInDay[]; today: string }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const reduced = useReducedMotion();
  const gradientId = `trend${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const [range, setRange] = useState<Range>(7);
  const [width, setWidth] = useState(0);

  const byDay = useMemo(() => new Map(days.map((d) => [d.day, d])), [days]);
  const dates = useMemo(
    () => Array.from({ length: range }, (_, i) => addDays(today, -(range - 1 - i))),
    [range, today],
  );
  const insights = useMemo(() => trendInsights(days, today, a), [days, today, a]);

  // Reveals the chart from left to right whenever the range changes.
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = reduced ? 1 : withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [range, reduced, reveal]);
  const revealStyle = useAnimatedStyle(() => ({ width: width * reveal.value }));

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (plotW * i) / (range - 1);
  const y = (score: number) => PAD.top + plotH * (1 - (score - 1) / 4);

  const mood = dates.map((d, i) => (byDay.get(d) ? { x: x(i), y: y(byDay.get(d)!.mood) } : null));
  const energy = dates.map((d, i) => (byDay.get(d) ? { x: x(i), y: y(byDay.get(d)!.energy) } : null));
  const labelEvery = range === 7 ? 1 : 6;

  return (
    <Glass style={{ padding: 16 }}>
      <View style={styles.head}>
        <Text style={[T.label, { color: c.faint, flex: 1 }]}>{a.trendTitle}</Text>
        <View style={[styles.switch, { backgroundColor: c.track }]}>
          {([7, 30] as const).map((value) => {
            const on = range === value;
            return (
              <Pressable
                key={value}
                onPress={() => setRange(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.switchItem, on ? { backgroundColor: c.primary } : null]}
              >
                <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: on ? c.onPrimary : c.muted }}>
                  {value === 7 ? a.trend7 : a.trend30}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ height: HEIGHT, marginTop: 12 }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <>
            <Svg width={width} height={HEIGHT} style={StyleSheet.absoluteFill}>
              {[1, 2, 3, 4, 5].map((score) => (
                <React.Fragment key={score}>
                  <Line
                    x1={PAD.left}
                    x2={width - PAD.right}
                    y1={y(score)}
                    y2={y(score)}
                    stroke={c.border}
                    strokeWidth={1}
                    strokeDasharray={score === 3 ? undefined : '3 5'}
                  />
                  <Circle cx={8} cy={y(score)} r={4} fill={scoreTone(score)} />
                </React.Fragment>
              ))}
              {dates.map((d, i) =>
                i % labelEvery === 0 || i === range - 1 ? (
                  <SvgText
                    key={d}
                    x={x(i)}
                    y={HEIGHT - 6}
                    fontSize={11}
                    fill={d === today ? c.text : c.faint}
                    textAnchor="middle"
                    fontWeight={d === today ? '700' : '400'}
                  >
                    {axisLabel(d, range, lang)}
                  </SvgText>
                ) : null,
              )}
            </Svg>
            <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, revealStyle]}>
              <Svg width={width} height={HEIGHT}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1={y(5)} x2="0" y2={y(1)} gradientUnits="userSpaceOnUse">
                    {SCORE_TONES.map((tone, i) => (
                      <Stop key={tone} offset={`${(4 - i) / 4}`} stopColor={tone} />
                    ))}
                  </LinearGradient>
                </Defs>
                <Path
                  d={linePath(energy)}
                  stroke={`url(#${gradientId})`}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.7}
                />
                <Path
                  d={linePath(mood)}
                  stroke={`url(#${gradientId})`}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {dates.map((d, i) => {
                  const day = byDay.get(d);
                  if (!day) return null;
                  const r = range === 7 ? 5 : 3;
                  return (
                    <React.Fragment key={d}>
                      <Circle cx={x(i)} cy={y(day.energy)} r={r - 1} fill={c.bg} stroke={scoreTone(day.energy)} strokeWidth={2} />
                      <Circle cx={x(i)} cy={y(day.mood)} r={r} fill={scoreTone(day.mood)} stroke={c.bg} strokeWidth={1.5} />
                    </React.Fragment>
                  );
                })}
              </Svg>
            </Animated.View>
          </>
        ) : null}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: c.text }]} />
          <Text style={[T.fine, { color: c.muted }]}>{a.moodName}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, styles.legendDashed, { borderColor: c.muted }]} />
          <Text style={[T.fine, { color: c.muted }]}>{a.energyName}</Text>
        </View>
      </View>

      <View style={{ gap: 6, marginTop: 12 }}>
        {insights.map((line) => (
          <View key={line} style={styles.insight}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={c.primary} style={{ marginTop: 1 }} />
            <Text style={[T.fine, { color: c.text, flex: 1 }]}>{line}</Text>
          </View>
        ))}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switch: { flexDirection: 'row', borderRadius: 999, padding: 3 },
  switchItem: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  legend: { flexDirection: 'row', gap: 18, marginTop: 6, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 18, height: 3, borderRadius: 2 },
  legendDashed: { height: 0, borderTopWidth: 2, borderStyle: 'dashed', backgroundColor: 'transparent' },
  insight: { flexDirection: 'row', gap: 8 },
});
