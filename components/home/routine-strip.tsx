// components/home/routine-strip.tsx — today's routines, tickable in place.
//
// TICKED HERE, NOT ON ANOTHER SCREEN.
//
// A routine is a five-second thing — "vitamins", "walk", "stretch". Making
// someone navigate to a second screen to record it costs more attention than
// the routine itself, and that is exactly how a habit feature stops being used
// in week two. So the dashboard writes directly.
//
// Only what is DUE today appears: a weekday-only routine isn't "missed" on a
// Sunday, and showing it greyed out would teach people to ignore the list.
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';

export type StripRoutine = {
  id: string;
  title: string;
  icon?: string | null;
  time?: string | null;
  done?: boolean | null;
  streak?: number | null;
};

function RoutineRow({
  routine, busy, onToggle,
}: {
  routine: StripRoutine;
  busy: boolean;
  onToggle: () => void;
}) {
  const { c, radius } = useTheme();

  const done = !!routine.done;

  return (
    <PressableScale
      onPress={onToggle}
      disabled={busy}
      style={[
        styles.row,
        {
          backgroundColor: done ? c.fieldBg : c.surface,
          borderColor: done ? 'transparent' : c.border,
          borderRadius: radius,
        },
      ]}
    >
      <View
        style={[
          styles.check,
          {
            backgroundColor: done ? c.primary : 'transparent',
            borderColor: done ? c.primary : c.borderStrong,
          },
        ]}
      >
        {busy
          ? <ActivityIndicator size="small" color={c.primary} />
          : <Ionicons name="checkmark" size={16} color={done ? c.onPrimary : 'transparent'} />}
      </View>

      <Ionicons
        // the icon is chosen in the app and stored as an Ionicons name, so it
        // may be anything — fall back rather than render a missing glyph box
        name={(routine.icon as keyof typeof Ionicons.glyphMap) || 'ellipse-outline'}
        size={17}
        color={done ? c.textFaint : c.primary}
      />

      <Text
        style={[
          styles.title,
          {
            color: done ? c.textMuted : c.text,
            // struck through, so a finished list still reads as *finished*
            // rather than as a list you have not started
            textDecorationLine: done ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={1}
      >
        {routine.title}
      </Text>

      {!!routine.time && !done && (
        <Text style={[styles.time, { color: c.textFaint }]}>{routine.time}</Text>
      )}

      {/* a streak worth mentioning is one you'd be sorry to break */}
      {(routine.streak ?? 0) >= 2 && (
        <View style={styles.streak}>
          <Ionicons name="flame" size={12} color="#F97316" />
          <Text style={[styles.streakText, { color: c.textMuted }]}>{routine.streak}</Text>
        </View>
      )}
    </PressableScale>
  );
}

export default function RoutineStrip({
  routines, doneCount, dueCount, busyId, onToggle, onAdd,
}: {
  routines: StripRoutine[];
  doneCount: number;
  dueCount: number;
  busyId: string | null;
  onToggle: (id: string, done: boolean) => void;
  onAdd: () => void;
}) {
  const { c, radius } = useTheme();
  const { t } = useStrings();

  // ------------------------------------------------------------------ empty
  if (!routines.length) {
    return (
      <PressableScale
        onPress={onAdd}
        style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius + 4 }]}
      >
        <View style={[styles.emptyIcon, { backgroundColor: '#DCFCE7' }]}>
          <Ionicons name="repeat-outline" size={20} color="#0F7A54" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noRoutinesToday}</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>{t.noRoutinesTodaySub}</Text>
        </View>

        <Ionicons name="add-circle" size={24} color={c.primary} />
      </PressableScale>
    );
  }

  const allDone = dueCount > 0 && doneCount >= dueCount;

  return (
    <View style={{ gap: 8 }}>
      {/* progress line — the whole point of a routine list is seeing it empty */}
      <View style={styles.progressWrap}>
        <View style={[styles.track, { backgroundColor: c.fieldBg }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: allDone ? '#16A34A' : c.primary,
                width: `${dueCount ? Math.round((doneCount / dueCount) * 100) : 0}%`,
              },
            ]}
          />
        </View>

        <Text style={[styles.progressText, { color: allDone ? '#16A34A' : c.textMuted }]}>
          {allDone ? t.routinesAllDone : `${doneCount}/${dueCount}`}
        </Text>
      </View>

      {routines.map((routine) => (
        <RoutineRow
          key={routine.id}
          routine={routine}
          busy={busyId === routine.id}
          onToggle={() => onToggle(routine.id, !routine.done)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 14.5, fontWeight: '600', letterSpacing: -0.2 },
  time: { fontSize: 12, fontWeight: '600' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakText: { fontSize: 12, fontWeight: '700' },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2, marginBottom: 2 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '800' },

  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1 },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  emptySub: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
});
