// History views shared by the steps, water and sleep pages: the 7-day average and
// best-day stats, a bar chart with a goal line, and the day-by-day list.
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { Section, Divider } from '@/components/panel';
import { MiniStat } from '@/components/steps-ring';
import { dayLabel } from '@/components/habits';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import type { HabitDay } from '@/graphql/habits';

type Pick = (day: HabitDay) => number;

/** Average of the last 7 days and the best day, as two small cards. */
export function HabitStats({
  days,
  value,
  format,
  bestCaption,
  tint,
}: {
  /** Newest first. */
  days: HabitDay[];
  value: Pick;
  format: (n: number) => string;
  bestCaption: string;
  tint?: string;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const week = days.slice(0, 7);
  const average = week.length ? week.reduce((sum, d) => sum + value(d), 0) / week.length : 0;
  const best = days.reduce<HabitDay | null>((top, d) => (!top || value(d) > value(top) ? d : top), null);
  const bestValue = best ? value(best) : 0;

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Glass style={styles.statCard}>
        <MiniStat icon="chart-bar" value={format(average)} caption={a.average} tint={tint} />
      </Glass>
      <Glass style={styles.statCard}>
        <MiniStat
          icon="trophy-outline"
          value={format(bestValue)}
          caption={best && bestValue > 0 ? `${bestCaption} · ${dayLabel(best.day, lang)}` : bestCaption}
          tint={c.successMark}
        />
      </Glass>
    </View>
  );
}

/** Bars for each day, oldest first, with a dashed line at the goal. */
export function HabitChart({
  days,
  goal,
  value,
  color,
}: {
  /** Oldest first. */
  days: HabitDay[];
  goal: number;
  value: Pick;
  color: string;
}) {
  const { c } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 88, 520);
  const height = 140;
  const top = Math.max(goal, ...days.map(value), 1);
  const slot = width / Math.max(days.length, 1);
  const barWidth = Math.max(6, slot * 0.6);
  const goalY = height - (goal / top) * height;

  return (
    <View style={{ gap: 6 }}>
      <Svg width={width} height={height}>
        {days.map((d, i) => {
          const v = value(d);
          const barHeight = Math.max(3, (v / top) * height);
          return (
            <Rect
              key={d.day}
              x={i * slot + (slot - barWidth) / 2}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill={v >= goal ? c.successMark : color}
              fillOpacity={v ? 1 : 0.25}
            />
          );
        })}
        <Line x1={0} x2={width} y1={goalY} y2={goalY} stroke={c.faint} strokeWidth={1} strokeDasharray="4 5" />
      </Svg>
      <View style={{ flexDirection: 'row', width }}>
        {days.map((d) => (
          <Text key={d.day} style={[T.fine, { color: c.faint, width: slot, textAlign: 'center', fontSize: 10 }]}>
            {Number(d.day.slice(8))}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Day-by-day list, newest first, with a tick on days the goal was met. */
export function HabitHistoryList({
  title,
  days,
  goal,
  value,
  format,
}: {
  title: string;
  /** Newest first; the first entry is today. */
  days: HabitDay[];
  goal: number;
  value: Pick;
  format: (n: number) => string;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];

  return (
    <Section title={title}>
      {days.map((entry, i) => {
        const v = value(entry);
        const met = v >= goal;
        return (
          <React.Fragment key={entry.day}>
            {i > 0 ? <Divider /> : null}
            <View style={styles.historyRow}>
              <Text style={[T.body, { color: c.text, flex: 1 }]}>
                {i === 0 ? a.dayToday : dayLabel(entry.day, lang)}
              </Text>
              <Text
                style={{
                  fontFamily: met ? font.bodySemi : font.body,
                  fontSize: 15,
                  color: met ? c.success : v ? c.text : c.faint,
                }}
              >
                {format(v)}
              </Text>
              <MaterialCommunityIcons
                name={met ? 'check-circle' : 'circle-outline'}
                size={18}
                color={met ? c.successMark : c.border}
                style={{ marginLeft: 10 }}
              />
            </View>
          </React.Fragment>
        );
      })}
    </Section>
  );
}

const styles = StyleSheet.create({
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
});
