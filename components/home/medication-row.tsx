// components/home/medication-row.tsx — one medication in "Medications today",
// with a tap-to-mark-taken button wired to the backend.
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import type { DueDoseStatus } from '@/graphql';

export default function MedicationRow({
  name,
  dosage,
  slot,
  taken,
  status,
  busy,
  onMarkTaken,
}: {
  name: string;
  dosage?: string | null;
  // The ONE scheduled time this row represents — "08:00". A twice-daily
  // medicine renders two of these rows, ticked independently. Null means an
  // as-needed medicine with no set time.
  slot?: string | null;
  taken: boolean;
  /** where this dose stands right now — see DueDoseStatus */
  status?: DueDoseStatus;
  busy?: boolean;
  onMarkTaken: () => void;
}) {
  const { c, radius } = useTheme();
  const { t } = useStrings();

  // LATE AND MISSED READ DIFFERENTLY, and the difference matters.
  //
  // Late is amber and still tickable — the tablet is worth taking an hour on.
  // Missed is grey and quiet: today is gone, and shouting about it helps
  // nobody. A red banner on a missed dose is how an app becomes something
  // people stop opening.
  const late = status === 'late';
  const missed = status === 'missed';

  const detail = [
    dosage,
    slot,
    late ? t.lateDose : missed ? t.missedDose : null,
  ].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: c.surface,
          borderColor: late ? '#F59E0B' : c.border,
          borderRadius: radius,
          // a missed dose recedes rather than shouts
          opacity: missed ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.pill, { backgroundColor: late ? '#FEF3C7' : c.fieldBg }]}>
        <Ionicons
          name={missed ? 'close-circle-outline' : 'medkit-outline'}
          size={20}
          color={late ? '#B45309' : missed ? c.textFaint : c.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{name}</Text>
        {!!detail && (
          <Text
            style={[styles.detail, { color: late ? '#B45309' : c.textMuted }]}
            numberOfLines={1}
          >
            {detail}
          </Text>
        )}
      </View>

      <Pressable
        onPress={taken ? undefined : onMarkTaken}
        disabled={taken || busy}
        hitSlop={8}
        style={[
          styles.check,
          {
            backgroundColor: taken ? c.primary : 'transparent',
            borderColor: taken ? c.primary : c.borderStrong,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : (
          <Ionicons name="checkmark" size={18} color={taken ? c.onPrimary : c.textFaint} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  pill: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15.5, fontWeight: '700' },
  detail: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  check: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
