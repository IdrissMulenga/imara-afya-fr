// components/home/stat-card.tsx — translucent stat tile shown inside the green hero.
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({
  icon,
  value,
  unit,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  unit?: string;
  label: string;
}) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.9)" />
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {!!unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  value: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  unit: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, fontWeight: '600' },
});
