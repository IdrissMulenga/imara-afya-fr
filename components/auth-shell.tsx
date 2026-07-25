// components/auth-shell.tsx — shared chrome for the auth screens (login / signup):
// the gradient hero + white sheet, plus small shared bits (Checkbox, styles).
import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import Logo from '@/components/logo';
import LangToggle from '@/components/lang-toggle';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[c.heroFrom, c.heroMid, c.heroTo]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 24 }]}
        >
          <View style={styles.heroTop}>
            <Logo size={36} light chip />
            <LangToggle hero />
          </View>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </LinearGradient>

        {/* Sheet */}
        <View style={[styles.sheet, { backgroundColor: c.bg }]}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>{subtitle}</Text>

          <View style={{ height: 22 }} />

          <View style={{ gap: 16 }}>{children}</View>

          <View style={{ height: insets.bottom + 24 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Checkbox({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onToggle} style={styles.checkRow} hitSlop={6}>
      <View
        style={[
          styles.box,
          { borderColor: checked ? c.primary : c.borderStrong, backgroundColor: checked ? c.primary : c.surface },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={15} color={c.onPrimary} />}
      </View>
      <Text style={[styles.checkLabel, { color: c.textMuted }]}>{children}</Text>
    </Pressable>
  );
}

/** Inline red error row (field-level or server-level). */
export function ErrorRow({ message }: { message: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.errRow}>
      <Ionicons name="alert-circle" size={14} color={c.danger} />
      <Text style={[styles.errText, { color: c.danger }]}>{message}</Text>
    </View>
  );
}

/** Bottom "Don't have an account? Sign up" prompt. */
export function AuthFooter({
  prompt,
  action,
  onPress,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: c.textMuted }]}>{prompt} </Text>
      <Pressable onPress={onPress} hitSlop={6}>
        <Text style={[styles.link, { color: c.primary }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

export const styles = StyleSheet.create({
  hero: { paddingHorizontal: 28, paddingBottom: 60 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagline: { marginTop: 34, color: '#fff', fontSize: 22, fontWeight: '700', maxWidth: 260, lineHeight: 28, letterSpacing: -0.2 },
  sheet: { marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 30, flex: 1 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { marginTop: 9, fontSize: 15, fontWeight: '500', lineHeight: 21 },
  betweenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { fontSize: 13.5, fontWeight: '600', flexShrink: 1, lineHeight: 18 },
  link: { fontSize: 13.5, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  footerText: { fontSize: 14, fontWeight: '600' },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  errText: { fontSize: 12.5, fontWeight: '600' },
});
