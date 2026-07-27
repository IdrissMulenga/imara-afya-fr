// components/home/medication-row.tsx — one medication in "Medications today",
// with a tap-to-mark-taken button wired to the backend.
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';

export default function MedicationRow({
  name,
  dosage,
  times,
  taken,
  busy,
  onMarkTaken,
}: {
  name: string;
  dosage?: string | null;
  times: string[];
  taken: boolean;
  busy?: boolean;
  onMarkTaken: () => void;
}) {
  const { c, radius } = useTheme();

  const detail = [dosage, times.length ? times.join(', ') : null].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius }]}>
      <View style={[styles.pill, { backgroundColor: c.fieldBg }]}>
        <Ionicons name="medkit-outline" size={20} color={c.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{name}</Text>
        {!!detail && (
          <Text style={[styles.detail, { color: c.textMuted }]} numberOfLines={1}>{detail}</Text>
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
