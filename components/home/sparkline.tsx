// components/home/sparkline.tsx — seven small bars, one per day.
//
// Bars rather than a line: with a goal to compare against, "did I hit it" is
// the question, and a filled/unfilled bar answers it instantly. A line would
// make the reader do the comparison themselves.
import { View, StyleSheet } from 'react-native';

import { useTheme } from '@/constants/theme';

export default function Sparkline({
  data,
  goal,
  color,
  height = 34,
}: {
  data: { date: string; value: number }[];
  // bars at or above this are drawn solid, below it faded
  goal?: number;
  color: string;
  height?: number;
}) {
  const { c } = useTheme();

  const max = Math.max(...data.map((d) => d.value), goal ?? 0, 1);

  return (
    <View style={[styles.row, { height }]}>
      {data.map((day) => {
        const met = goal != null && day.value >= goal;
        // always show a sliver, so an empty day reads as "nothing" not "missing"
        const barHeight = Math.max((day.value / max) * height, 3);

        return (
          <View
            key={day.date}
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: day.value === 0 ? c.fieldBg : color,
                opacity: day.value === 0 ? 1 : met ? 1 : 0.45,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bar: { flex: 1, borderRadius: 3, minHeight: 3 },
});
