// components/buttons.tsx — primary button + social (Apple) buttons
import React from 'react';
import { Text, Pressable, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { AppleIcon } from '@/components/brand-icons';

export type SocialProvider = 'google' | 'apple';

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { c, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: c.primary,
          borderRadius: radius,
          shadowColor: c.primary,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.975 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.onPrimary} />
      ) : (
        <>
          <Text style={[styles.primaryLabel, { color: c.onPrimary }]}>{label}</Text>
          <Ionicons name="arrow-forward" size={18} color={c.onPrimary} />
        </>
      )}
    </Pressable>
  );
}

export function SocialButtons({
  onProvider,
  loadingProvider,
  disabled,
}: {
  onProvider: (provider: SocialProvider) => void;
  loadingProvider?: SocialProvider | null;
  disabled?: boolean;
}) {
  const { c, radius } = useTheme();

  const Btn = ({ provider, children }: { provider: SocialProvider; children: React.ReactNode }) => {
    const isLoading = loadingProvider === provider;
    return (
      <Pressable
        onPress={() => onProvider(provider)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.social,
          {
            backgroundColor: c.surface,
            borderColor: c.borderStrong,
            borderRadius: radius,
            transform: [{ scale: pressed ? 0.975 : 1 }],
          },
        ]}
      >
        {isLoading ? <ActivityIndicator color={c.primary} /> : children}
      </Pressable>
    );
  };

  // Only Sign in with Apple is offered (iOS). Google sign-in is disabled for now.
  return (
    <View style={styles.socialRow}>
      <Btn provider="apple">
        <AppleIcon color={c.text} />
        <Text style={[styles.socialLabel, { color: c.text }]}>Apple</Text>
      </Btn>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 17,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryLabel: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.2 },
  socialRow: { flexDirection: 'row', gap: 11 },
  social: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  socialLabel: { fontSize: 15, fontWeight: '700' },
});
