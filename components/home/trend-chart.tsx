// components/home/trend-chart.tsx — a real week, not a thumbnail.
//
// The sparkline in the corner of a card answers "is there data". This answers
// "how has my week actually gone", which is the question that makes someone
// come back tomorrow — a single day's number tells you nothing you didn't
// already know.
//
// Still bars, not a line. With a goal to compare against, "did I hit it" is the
// question, and a bar that crosses a dashed line answers it without the reader
// doing any work.
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';

export type TrendPoint = { date: string; value: number };

// Sunday-first, matching the routine `days` numbering the backend uses, so the
// two features never disagree about which day a column is.
const WEEKDAY_KEYS = [
  'daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat',
] as const;

/** Which weekday a "YYYY-MM-DD" falls on, built from UTC so it can't shift. */
const weekdayOf = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);

  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export default function TrendChart({
  data, goal, color, unit, height = 92,
}: {
  data: TrendPoint[];
  /** bars at or above this are solid, below it faded; also draws the goal line */
  goal?: number;
  color: string;
  unit?: string;
  height?: number;
}) {
  const { c } = useTheme();
  const { t } = useStrings();

  const max = Math.max(...data.map((d) => d.value), goal ?? 0, 1);

  const hit = goal ? data.filter((d) => d.value >= goal).length : 0;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  // rounded, because "4.857 a day" is noise dressed up as precision
  const average = data.length ? Math.round((total / data.length) * 10) / 10 : 0;

  const today = data[data.length - 1]?.date;

  return (
    <View style={{ gap: 12 }}>
      {/* the two numbers worth reading before the chart itself */}
      <View style={styles.summary}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: c.text }]}>
            {average}
            {!!unit && <Text style={[styles.statUnit, { color: c.textMuted }]}> {unit}</Text>}
          </Text>
          <Text style={[styles.statLabel, { color: c.textMuted }]}>{t.dailyAverage}</Text>
        </View>

        {!!goal && (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: hit ? '#16A34A' : c.text }]}>
              {hit}
              <Text style={[styles.statUnit, { color: c.textMuted }]}> / {data.length}</Text>
            </Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{t.goalDaysMet}</Text>
          </View>
        )}
      </View>

      <View style={{ height, justifyContent: 'flex-end' }}>
        {/* the goal, as a dashed rule behind the bars */}
        {!!goal && goal <= max && (
          <View
            style={[
              styles.goalLine,
              { borderColor: c.borderStrong, bottom: (goal / max) * height },
            ]}
          />
        )}

        <View style={styles.bars}>
          {data.map((day) => {
            const met = goal != null && day.value >= goal;
            const isToday = day.date === today;
            // always show a sliver, so an empty day reads as "none" not "missing"
            const barHeight = Math.max((day.value / max) * height, 4);

            return (
              <View key={day.date} style={styles.column}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: day.value === 0 ? c.fieldBg : color,
                      opacity: day.value === 0 ? 1 : met ? 1 : 0.42,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.bars}>
        {data.map((day) => (
          <View key={day.date} style={styles.column}>
            <Text
              style={[
                styles.dayLabel,
                {
                  color: day.date === today ? c.text : c.textFaint,
                  fontWeight: day.date === today ? '800' : '600',
                },
              ]}
            >
              {t[WEEKDAY_KEYS[weekdayOf(day.date)]]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 26 },
  stat: { gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  statUnit: { fontSize: 13, fontWeight: '600', letterSpacing: 0 },
  statLabel: { fontSize: 11.5, fontWeight: '600' },

  bars: { flexDirection: 'row', gap: 7, alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', borderRadius: 5, minHeight: 4 },

  goalLine: {
    position: 'absolute', left: 0, right: 0,
    borderTopWidth: 1, borderStyle: 'dashed',
  },

  dayLabel: { fontSize: 10.5, letterSpacing: 0.2 },
});
