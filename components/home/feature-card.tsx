// components/home/feature-card.tsx — a dashboard card that actually says something.
//
// The old quick actions were icon + title + static subtitle, which is a menu
// pretending to be a dashboard. These show live numbers, so the card is worth
// reading even when she doesn't tap it.
import { type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { PressableScale } from '@/components/motion';

export default function FeatureCard({
  icon,
  tint,
  iconColor,
  title,
  value,
  unit,
  caption,
  accessory,
  badge,
  onPress,
  wide,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  iconColor: string;
  title: string;
  // the headline number — the reason to look at the card
  value?: string | number;
  unit?: string;
  caption?: string;
  // a ring, sparkline or anything else that visualises the same data
  accessory?: ReactNode;
  badge?: string;
  onPress?: () => void;
  wide?: boolean;
}) {
  const { c, radius } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          borderRadius: radius + 6,
          flex: wide ? undefined : 1,
        },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.iconTile, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={19} color={iconColor} />
        </View>

        {!!badge && (
          <View style={[styles.badge, { backgroundColor: c.ring }]}>
            <Text style={[styles.badgeText, { color: c.primary }]}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.textMuted }]} numberOfLines={1}>
            {title}
          </Text>

          {value !== undefined && (
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: c.text }]}>{value}</Text>
              {!!unit && <Text style={[styles.unit, { color: c.textMuted }]}>{unit}</Text>}
            </View>
          )}

          {!!caption && (
            <Text style={[styles.caption, { color: c.textFaint }]} numberOfLines={1}>
              {caption}
            </Text>
          )}
        </View>

        {!!accessory && <View style={styles.accessory}>{accessory}</View>}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14, minHeight: 132, justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  iconTile: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.2 },

  body: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12 },
  title: { fontSize: 12.5, fontWeight: '700' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 3 },
  value: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  unit: { fontSize: 12.5, fontWeight: '700' },
  caption: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  accessory: { alignItems: 'flex-end', justifyContent: 'flex-end' },
});
