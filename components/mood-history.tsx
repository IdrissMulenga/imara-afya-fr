// The full mood and energy chart: a fixed 1-5 scale, scrolling lines for the focused score
// (solid) and the other (dashed) that break on days without a check-in, dates and months
// underneath, and the tapped day's face, battery and words above.
import React, { useId, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { Pressable } from '@/components/pressable';
import { dayLabel } from '@/components/habits';
import { ScoreArt } from '@/components/checkin';
import { SCORE_TONES, scoreTone } from '@/components/mood-art';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import type { CheckInDay } from '@/graphql/checkin';

const AXIS = 22;
const LABELS = 30;
const HEIGHT = 190;
const PAD_Y = 12;

export type MoodFocus = 'mood' | 'energy';

const monthText = (day: string, lang: Lang): string => {
  try {
    return new Date(`${day}T12:00:00Z`).toLocaleDateString(lang === 'rn' ? 'fr' : lang, {
      month: 'short',
      timeZone: 'UTC',
    });
  } catch {
    return day.slice(5, 7);
  }
};

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

export function MoodHistoryChart({
  dates,
  byDay,
  today,
  focus = 'mood',
}: {
  /** Every day in the range, oldest first. */
  dates: string[];
  byDay: Map<string, CheckInDay>;
  today: string;
  /** The score drawn solid and named first. */
  focus?: MoodFocus;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const gradientId = `full${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const scroller = useRef<ScrollView>(null);
  const [areaWidth, setAreaWidth] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  // Short ranges fill the width; long ones keep points apart and scroll.
  const minSlot = dates.length > 45 ? 14 : 22;
  const slot = areaWidth ? Math.max(minSlot, areaWidth / Math.max(dates.length, 1)) : minSlot;
  const width = slot * dates.length;
  const everyDay = slot >= 20;
  const x = (i: number) => i * slot + slot / 2;
  const y = (score: number) => PAD_Y + (HEIGHT - PAD_Y * 2) * (1 - (score - 1) / 4);

  const other: MoodFocus = focus === 'mood' ? 'energy' : 'mood';
  const points = (key: MoodFocus) =>
    dates.map((d, i) => (byDay.get(d) ? { x: x(i), y: y(byDay.get(d)![key]) } : null));

  // The tapped day, else the newest day with a check-in.
  const latest = [...dates].reverse().find((d) => byDay.has(d)) ?? dates[dates.length - 1];
  const selectedDay = picked ?? latest;
  const selected = byDay.get(selectedDay);
  const selectedIndex = dates.indexOf(selectedDay);

  const onArea = (e: LayoutChangeEvent) => setAreaWidth(e.nativeEvent.layout.width);
  const wordOf = (key: MoodFocus, day: CheckInDay) =>
    (key === 'mood' ? a.moodWords : a.energyWords)[Math.round(day[key]) - 1];
  const words = (day: CheckInDay) => `${wordOf(focus, day)} · ${wordOf(other, day)}`;
  const nameOf = (key: MoodFocus) => (key === 'mood' ? a.moodName : a.energyName);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.readout}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[T.fine, { color: c.muted }]}>
            {selectedDay === today ? a.dayToday : dayLabel(selectedDay, lang)} · {monthText(selectedDay, lang)}
          </Text>
          <Text
            style={{ fontFamily: font.displayBold, fontSize: 20, color: selected ? scoreTone(selected[focus]) : c.faint }}
            numberOfLines={2}
          >
            {selected ? words(selected) : a.moodNoCheckIn}
          </Text>
          {selected && selected.entries.length > 1 ? (
            <Text style={[T.fine, { color: c.faint }]}>{a.moodCheckInsN.replace('{n}', String(selected.entries.length))}</Text>
          ) : null}
        </View>
        {selected ? (
          <View style={styles.art}>
            <ScoreArt kind={focus} score={selected[focus]} size={38} />
            <ScoreArt kind={other} score={selected[other]} size={26} />
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS, height: HEIGHT }}>
          <Svg width={AXIS} height={HEIGHT}>
            {[1, 2, 3, 4, 5].map((score) => (
              <Circle key={score} cx={8} cy={y(score)} r={4} fill={scoreTone(score)} />
            ))}
          </Svg>
        </View>

        <View style={{ flex: 1 }} onLayout={onArea}>
          <ScrollView
            ref={scroller}
            horizontal
            showsHorizontalScrollIndicator={false}
            // Opens on the newest days, at the right.
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
          >
            <View style={{ width }}>
              <Svg width={width} height={HEIGHT} pointerEvents="none">
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1={y(5)} x2="0" y2={y(1)} gradientUnits="userSpaceOnUse">
                    {SCORE_TONES.map((tone, i) => (
                      <Stop key={tone} offset={`${(4 - i) / 4}`} stopColor={tone} />
                    ))}
                  </LinearGradient>
                </Defs>
                {[1, 2, 3, 4, 5].map((score) => (
                  <Line
                    key={score}
                    x1={0}
                    x2={width}
                    y1={y(score)}
                    y2={y(score)}
                    stroke={c.border}
                    strokeWidth={1}
                    strokeDasharray={score === 3 ? undefined : '3 5'}
                  />
                ))}
                {selectedIndex >= 0 ? (
                  <Line x1={x(selectedIndex)} x2={x(selectedIndex)} y1={0} y2={HEIGHT} stroke={c.faint} strokeWidth={1} />
                ) : null}
                <Path
                  d={linePath(points(other))}
                  stroke={`url(#${gradientId})`}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.7}
                />
                <Path
                  d={linePath(points(focus))}
                  stroke={`url(#${gradientId})`}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {dates.map((d, i) => {
                  const day = byDay.get(d);
                  if (!day) return null;
                  const big = d === selectedDay;
                  const r = big ? 6 : slot >= 20 ? 4 : 3;
                  return (
                    <React.Fragment key={d}>
                      <Circle cx={x(i)} cy={y(day[other])} r={r - 1} fill={c.bg} stroke={scoreTone(day[other])} strokeWidth={2} />
                      <Circle cx={x(i)} cy={y(day[focus])} r={r} fill={scoreTone(day[focus])} stroke={c.bg} strokeWidth={1.5} />
                    </React.Fragment>
                  );
                })}
              </Svg>

              <View style={styles.hits}>
                {dates.map((d) => {
                  const day = byDay.get(d);
                  return (
                    <Pressable
                      key={d}
                      ripple="none"
                      onPress={() => setPicked(d)}
                      accessibilityRole="button"
                      accessibilityLabel={`${dayLabel(d, lang)}: ${day ? words(day) : a.moodNoCheckIn}`}
                      style={{ width: slot, height: HEIGHT + LABELS }}
                    />
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', height: LABELS }} pointerEvents="none">
                {dates.map((d, i) => {
                  const date = Number(d.slice(8));
                  const fromEnd = dates.length - 1 - i;
                  const isPicked = d === selectedDay;
                  return (
                    <View key={d} style={{ width: slot, alignItems: 'center', overflow: 'visible' }}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.date,
                          { color: isPicked ? c.text : c.faint, fontFamily: isPicked ? font.bodySemi : font.body },
                        ]}
                      >
                        {everyDay || fromEnd % 7 === 0 || isPicked ? date : ''}
                      </Text>
                      {date === 1 || i === 0 ? (
                        <Text numberOfLines={1} style={[styles.month, { color: c.muted }]}>
                          {monthText(d, lang)}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: c.text }]} />
          <Text style={[T.fine, { color: c.muted }]}>{nameOf(focus)}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, styles.legendDashed, { borderColor: c.muted }]} />
          <Text style={[T.fine, { color: c.muted }]}>{nameOf(other)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  art: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hits: { position: 'absolute', left: 0, top: 0, flexDirection: 'row' },
  date: { fontSize: 10, lineHeight: 14 },
  month: { position: 'absolute', top: 14, left: 2, width: 44, fontSize: 9, lineHeight: 12 },
  legend: { flexDirection: 'row', gap: 18, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 18, height: 3, borderRadius: 2 },
  legendDashed: { height: 0, borderTopWidth: 2, borderStyle: 'dashed', backgroundColor: 'transparent' },
});
