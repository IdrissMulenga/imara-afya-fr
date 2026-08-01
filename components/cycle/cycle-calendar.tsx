// components/cycle/cycle-calendar.tsx — month view of the cycle.
//
// Hand-rolled rather than pulling in react-native-calendars: that package is a
// large dependency for one screen, and we only need four day states. Tapping a
// past day logs a period starting then, which is how a real user works — she
// usually remembers a day or two later, not on the morning it starts.
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';
import {
  addDaysIso, daysInMonth, firstWeekdayOfMonth, parseIso, rangeIso, toIso, todayIso,
} from '@/lib/dates';
import type { CyclePrediction, PeriodCycle } from '@/graphql';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CycleCalendar({
  cycles,
  prediction,
  onSelectDay,
}: {
  cycles: PeriodCycle[];
  prediction: CyclePrediction | null;
  onSelectDay: (iso: string) => void;
}) {
  const { c } = useTheme();
  const { t } = useStrings();

  const today = todayIso();
  const now = parseIso(today);

  const [year, setYear] = useState(now.year);
  const [monthIndex, setMonthIndex] = useState(now.monthIndex);

  // days she actually bled — an open cycle runs up to today, not forever
  const periodDays = useMemo(() => {
    const set = new Set<string>();

    for (const cycle of cycles) {
      const end = cycle.endDate ?? today;
      for (const iso of rangeIso(cycle.startDate, end, 60)) set.add(iso);
    }

    return set;
  }, [cycles, today]);

  // where the next period is expected, using her own average period length
  const predictedDays = useMemo(() => {
    const set = new Set<string>();
    const start = prediction?.nextPeriodDate;

    if (!start) return set;

    const length = prediction?.averagePeriodLength ?? 5;

    for (const iso of rangeIso(start, addDaysIso(start, length - 1), 30)) set.add(iso);

    return set;
  }, [prediction]);

  const fertileDays = useMemo(() => {
    const set = new Set<string>();
    const { fertileWindowStart: from, fertileWindowEnd: to } = prediction ?? {};

    if (!from || !to) return set;

    for (const iso of rangeIso(from, to, 30)) set.add(iso);

    return set;
  }, [prediction]);

  const step = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  };

  const total = daysInMonth(year, monthIndex);
  const leading = firstWeekdayOfMonth(year, monthIndex);

  // pad the front so the 1st lands on the right weekday
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, i) => toIso(year, monthIndex, i + 1)),
  ];

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      {/* month header */}
      <View style={styles.header}>
        <PressableScale onPress={() => step(-1)} hitSlop={10} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={19} color={c.textMuted} />
        </PressableScale>

        <Text style={[styles.monthLabel, { color: c.text }]}>
          {MONTHS[monthIndex]} {year}
        </Text>

        <PressableScale onPress={() => step(1)} hitSlop={10} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={19} color={c.textMuted} />
        </PressableScale>
      </View>

      {/* weekday row */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, i) => (
          <Text key={i} style={[styles.weekday, { color: c.textFaint }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* day grid */}
      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={`pad-${i}`} style={styles.cell} />;

          const isToday = iso === today;
          const isPeriod = periodDays.has(iso);
          const isPredicted = !isPeriod && predictedDays.has(iso);
          const isFertile = !isPeriod && !isPredicted && fertileDays.has(iso);
          const isFuture = iso > today;

          const bg = isPeriod ? c.danger : isFertile ? c.ring : 'transparent';
          const fg = isPeriod ? '#fff' : isFuture ? c.textFaint : c.text;

          return (
            <PressableScale
              key={iso}
              // the backend refuses future dates, so don't offer them
              disabled={isFuture}
              onPress={() => onSelectDay(iso)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.day,
                  { backgroundColor: bg },
                  isPredicted && { borderWidth: 1.5, borderColor: c.danger, borderStyle: 'dashed' },
                  isToday && !isPeriod && { borderWidth: 1.5, borderColor: c.primary },
                ]}
              >
                <Text style={[styles.dayText, { color: fg }]}>{parseIso(iso).day}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      {/* legend — three colours is already the limit of what reads at a glance */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: c.danger }]} />
          <Text style={[styles.legendText, { color: c.textMuted }]}>{t.legendPeriod}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.swatch, { borderWidth: 1.5, borderColor: c.danger, borderStyle: 'dashed' }]} />
          <Text style={[styles.legendText, { color: c.textMuted }]}>{t.legendPredicted}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: c.ring }]} />
          <Text style={[styles.legendText, { color: c.textMuted }]}>{t.legendFertile}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },

  weekRow: { flexDirection: 'row', marginTop: 12 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  // 100/7 — keeps seven columns exact on every screen width
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '700' },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 11, height: 11, borderRadius: 6 },
  legendText: { fontSize: 11.5, fontWeight: '600' },
});
