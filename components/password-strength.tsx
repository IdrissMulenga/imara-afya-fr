// components/password-strength.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';

export function scorePassword(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function PasswordStrength({ password }: { password: string }) {
  const { c } = useTheme();
  const { t } = useStrings();
  const score = useMemo(() => scorePassword(password), [password]);

  if (!password) return null;

  const palette = [c.danger, '#f59e0b', '#3b82f6', c.primary];
  const labels = [t.weak, t.fair, t.good, t.strong];
  const idx = Math.max(0, score - 1);
  const col = palette[idx];

  return (
    <View style={{ gap: 7, marginTop: 8 }}>
      <View style={styles.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < score ? col : c.border }]} />
        ))}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: col }}>{labels[idx]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', gap: 5, height: 5 },
  bar: { flex: 1, borderRadius: 99 },
});
