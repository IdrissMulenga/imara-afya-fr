// components/records/record-row.tsx — one saved health record.
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { PressableScale } from '@/components/motion';

// each record type gets its own icon + tint so the list is scannable
const LOOK: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  Condition: { icon: 'pulse-outline', tint: '#DCFCE7' },
  Allergy: { icon: 'alert-circle-outline', tint: '#FEE2E2' },
  Medication: { icon: 'medkit-outline', tint: '#DBEAFE' },
};

export default function RecordRow({
  name,
  note,
  type,
  attachmentCount = 0,
  onPress,
}: {
  name: string;
  note?: string | null;
  type: string;
  attachmentCount?: number;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const look = LOOK[type] ?? LOOK.Condition;

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <View style={[styles.icon, { backgroundColor: look.tint }]}>
        <Ionicons name={look.icon} size={19} color="#0F7A54" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {name}
        </Text>
        {!!note && (
          <Text style={[styles.note, { color: c.textMuted }]} numberOfLines={1}>
            {note}
          </Text>
        )}
      </View>

      {attachmentCount > 0 && (
        <View style={styles.attach}>
          <Ionicons name="attach-outline" size={14} color={c.textFaint} />
          <Text style={[styles.attachText, { color: c.textFaint }]}>{attachmentCount}</Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  note: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  attach: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  attachText: { fontSize: 12, fontWeight: '700' },
});
