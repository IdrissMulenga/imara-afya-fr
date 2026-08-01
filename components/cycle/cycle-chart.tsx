// components/cycle/cycle-chart.tsx — how her cycle length varies.
//
// One bar per completed cycle, with her average drawn across them. The point
// isn't the individual numbers — it's whether the bars are level or ragged,
// because a consistently irregular cycle is worth raising with a clinician.
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { daysBetweenIso } from '@/lib/dates';
import type { PeriodCycle } from '@/graphql';

const HEIGHT = 132;
const BAR_GAP = 8;
// show at most this many, newest last — more than a year is unreadable on a phone
const MAX_BARS = 8;

export default function CycleChart({ cycles, width }: { cycles: PeriodCycle[]; width: number }) {
  const { c } = useTheme();
  const { t } = useStrings();

  // gaps between consecutive start dates, oldest first
  const lengths = useMemo(() => {
    // the list arrives newest first; reverse so the chart reads left to right
    const ordered = [...cycles].reverse();
    const out: { length: number; startDate: string }[] = [];

    for (let i = 1; i < ordered.length; i++) {
      const gap = daysBetweenIso(ordered[i - 1].startDate, ordered[i].startDate);

      // ignore anything implausible rather than letting it flatten the chart
      if (gap > 10 && gap < 90) {
        out.push({ length: gap, startDate: ordered[i].startDate });
      }
    }

    return out.slice(-MAX_BARS);
  }, [cycles]);

  // two cycles produce one gap, which isn't a trend worth drawing
  if (lengths.length < 2) {
    return (
      <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.chartNeedsMore}</Text>
      </View>
    );
  }

  const average = Math.round(lengths.reduce((sum, l) => sum + l.length, 0) / lengths.length);

  // pad the scale so the tallest bar doesn't touch the ceiling
  const max = Math.max(...lengths.map((l) => l.length), average) + 4;
  const min = Math.max(Math.min(...lengths.map((l) => l.length), average) - 6, 0);
  const span = Math.max(max - min, 1);

  const chartWidth = width - 28;
  const barWidth = Math.max((chartWidth - BAR_GAP * (lengths.length - 1)) / lengths.length, 8);

  const y = (value: number) => HEIGHT - ((value - min) / span) * HEIGHT;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.text }]}>{t.chartTitle}</Text>
        <Text style={[styles.avg, { color: c.textMuted }]}>
          {t.avgCycle} {average} {t.dayCountPlural}
        </Text>
      </View>

      <Svg width={chartWidth} height={HEIGHT + 22}>
        {/* average line — the reference the bars are read against */}
        <Line
          x1={0}
          y1={y(average)}
          x2={chartWidth}
          y2={y(average)}
          stroke={c.primary}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {lengths.map((item, i) => {
          const x = i * (barWidth + BAR_GAP);
          const top = y(item.length);

          return (
            <G key={item.startDate}>
              <Rect
                x={x}
                y={top}
                width={barWidth}
                height={Math.max(HEIGHT - top, 2)}
                rx={5}
                fill={c.primary}
                opacity={0.85}
              />
              {/* the number matters more than the bar on a small screen */}
              <SvgText
                x={x + barWidth / 2}
                y={HEIGHT + 15}
                fontSize={10}
                fontWeight="700"
                fill={c.textFaint}
                textAnchor="middle"
              >
                {item.length}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  avg: { fontSize: 12, fontWeight: '600' },

  empty: {
    borderWidth: 1, borderRadius: 20, padding: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
});
