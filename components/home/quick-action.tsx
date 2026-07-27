// components/home/quick-action.tsx — white card with a tinted icon tile.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';

export default function QuickAction({
  icon,
  tint,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  /** background tint for the icon tile */
  tint: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const { c, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          borderRadius: radius + 4,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={22} color={c.text} />
      </View>
      <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{title}</Text>
      {!!subtitle && (
        <Text style={[styles.sub, { color: c.textMuted }]} numberOfLines={1}>{subtitle}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderWidth: 1, padding: 16, gap: 10, minHeight: 132, justifyContent: 'center' },
  iconTile: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2, marginTop: 4 },
  sub: { fontSize: 12.5, fontWeight: '500' },
});
