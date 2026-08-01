// components/home/section-header.tsx — "Title ............ View all"
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/constants/theme';

export default function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { c } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {!!actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: c.primary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18.5, fontWeight: '800', letterSpacing: -0.4 },
  action: { fontSize: 14, fontWeight: '700' },
});
