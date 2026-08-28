// app/(home)/password.tsx — change the password you sign in with.
//
// Current password, new password, confirm. Straightforward, except for one
// thing worth getting right:
//
// AFTER FIVE WRONG ATTEMPTS the backend stops accepting guesses and returns
// USE_PASSWORD_RESET. Someone who cannot remember their current password will
// not remember it on the sixth try — so instead of a sixth failure we offer the
// way out, which proves identity by email rather than by memory.
import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { ScreenHeader } from '@/components/hero-backdrop';
import { useTabBarInset } from '@/components/glass-surface';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import TextField from '@/components/text-field';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import usePassword from '@/hooks/use-password';

export default function PasswordScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const { change, requestReset, saving, sending } = usePassword();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // set once the backend says the guesses are used up — from then on the screen
  // stops offering the form and offers the reset instead
  const [lockedOut, setLockedOut] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const submit = async () => {
    setError(null);

    // Check the two new fields match BEFORE spending an attempt. A typo in the
    // confirm box is not a wrong current password, and burning one of five
    // tries on it would be unfair.
    if (next !== confirm) {
      setError(t.errPasswordMismatch);
      return;
    }

    if (current === next) {
      setError(t.errSamePassword);
      return;
    }

    try {
      await change(current, next);

      toast.success(t.passwordChanged);
      router.back();
    } catch (err) {
      const e = err as { errors?: { extensions?: { code?: string; attemptsLeft?: number } }[] };
      const ext = e?.errors?.[0]?.extensions;

      if (ext?.code === 'USE_PASSWORD_RESET') {
        setLockedOut(true);
        setError(t.useResetInstead);
        return;
      }

      if (typeof ext?.attemptsLeft === 'number') setAttemptsLeft(ext.attemptsLeft);

      setError(errorMessage(err, t.errGeneric));
    }
  };

  const onReset = async () => {
    try {
      await requestReset();
      toast.success(t.resetSent);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <ScreenHeader back title={t.changePasswordTitle} subtitle={t.changePasswordSub} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 + tabBarInset }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.body}>
          {lockedOut ? (
            // THE WAY OUT. The form is gone — offering it again would just
            // produce another rejection.
            <FadeIn index={0} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[styles.lockIcon, { backgroundColor: c.dangerRing }]}>
                <Ionicons name="lock-closed-outline" size={22} color={c.danger} />
              </View>

              <Text style={[styles.lockTitle, { color: c.text }]}>{t.forgotCurrent}</Text>
              <Text style={[styles.lockBody, { color: c.textMuted }]}>{t.useResetInstead}</Text>

              <PressableScale
                onPress={onReset}
                disabled={sending}
                style={[styles.primary, { backgroundColor: c.primary }]}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryText}>{t.resetByEmail}</Text>}
              </PressableScale>
            </FadeIn>
          ) : (
            <>
              <FadeIn index={0}>
                <TextField
                  label={t.currentPassword}
                  value={current}
                  onChangeText={(v) => { setCurrent(v); if (error) setError(null); }}
                  placeholder={t.passwordPh}
                  secure
                  autoCapitalize="none"
                />
              </FadeIn>

              <FadeIn index={1}>
                <TextField
                  label={t.newPassword}
                  value={next}
                  onChangeText={(v) => { setNext(v); if (error) setError(null); }}
                  placeholder={t.passwordPh}
                  secure
                  autoCapitalize="none"
                />
              </FadeIn>

              <FadeIn index={2}>
                <TextField
                  label={t.confirmPassword}
                  value={confirm}
                  onChangeText={(v) => { setConfirm(v); if (error) setError(null); }}
                  placeholder={t.passwordPh}
                  secure
                  autoCapitalize="none"
                />
              </FadeIn>

              {!!error && (
                <View style={styles.errRow}>
                  <Ionicons name="alert-circle" size={15} color={c.danger} />
                  <Text style={[styles.errText, { color: c.danger }]}>{error}</Text>
                </View>
              )}

              {/* Warn before the door closes rather than after. Only shown once
                  they've actually got one wrong. */}
              {attemptsLeft != null && attemptsLeft > 0 && (
                <Text style={[styles.attempts, { color: c.textMuted }]}>
                  {attemptsLeft} {t.attemptsLeft}
                </Text>
              )}

              <PressableScale
                onPress={submit}
                disabled={saving || !current || !next || !confirm}
                style={[
                  styles.primary,
                  {
                    backgroundColor: c.primary,
                    opacity: !current || !next || !confirm ? 0.5 : 1,
                  },
                ]}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryText}>{t.save}</Text>}
              </PressableScale>

              {/* always available — nobody should have to fail five times to
                  find the reset link */}
              <PressableScale onPress={onReset} disabled={sending} style={styles.ghost}>
                <Text style={[styles.ghostText, { color: c.primary }]}>{t.forgotCurrent}</Text>
              </PressableScale>
            </>
          )}
        </View>
      </ScrollView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({

  body: { paddingHorizontal: 22, paddingTop: 22, gap: 14 },

  card: { borderWidth: 1, borderRadius: 22, padding: 22, alignItems: 'center' },
  lockIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  lockTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  lockBody: { fontSize: 13.5, fontWeight: '500', textAlign: 'center', marginTop: 8, lineHeight: 19 },

  errRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errText: { flex: 1, fontSize: 13, fontWeight: '600' },
  attempts: { fontSize: 12.5, fontWeight: '600', textAlign: 'right' },

  primary: {
    borderRadius: 16, paddingVertical: 16, marginTop: 8,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghost: { paddingVertical: 14, alignItems: 'center' },
  ghostText: { fontSize: 14, fontWeight: '700' },
});
