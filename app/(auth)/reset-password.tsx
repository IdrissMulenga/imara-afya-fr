import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import TextField from '@/components/text-field';
import { PrimaryButton } from '@/components/buttons';
import { AuthShell, AuthFooter, ErrorRow } from '@/components/auth-shell';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import usePassword from '@/hooks/use-password';

// matches the backend: 8 characters, no 0/O and no 1/I/L
const CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;

// matches assertValidPassword on the backend
const MIN_PASSWORD = 8;

export default function ResetPasswordScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const toast = useToast();

  // Filled in by the deep link when it worked. `useLocalSearchParams` gives
  // these whether the app was cold-started by the link or already running.
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const { reset, resetting } = usePassword();

  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // when the link supplied both, there is nothing for the user to type up top
  const fromLink = Boolean(params.email && params.token);

  const submit = async () => {
    setError(null);

    if (!email.trim()) {
      setError(t.errEmail);
      return;
    }

    // Uppercased for the user rather than rejecting them for it — the code is
    // case-insensitive on the backend and nobody should fail for typing it in
    // lower case.
    const cleanCode = code.trim().toUpperCase();

    if (!CODE_RE.test(cleanCode)) {
      setError(t.errCodeFormat);
      return;
    }

    // The backend enforces this too, but catching it here saves a round trip
    // and, more to the point, saves burning the single-use code on a password
    // the server was always going to reject.
    if (password.length < MIN_PASSWORD) {
      setError(t.errPwShort);
      return;
    }

    // THE CHECK THE USER ASKED FOR — before anything is sent, so a typo costs
    // nothing but a re-type.
    if (password !== confirm) {
      setError(t.errPasswordMismatch);
      return;
    }

    try {
      await reset(email.trim().toLowerCase(), cleanCode, password);

      // toast first, then navigate — the provider lives above the navigator so
      // the message survives the screen it was fired from disappearing
      toast.success(t.passwordResetDone);

      router.replace('/(auth)/login');
    } catch (err) {
      setError(errorMessage(err, t.errGeneric));
    }
  };

  return (
    <AuthShell title={t.resetTitle} subtitle={fromLink ? t.resetSubLink : t.resetSubCode}>
      {/* Only asked for when the link didn't carry them. Showing an email box
          to someone who arrived by link would look like we lost their details. */}
      {!fromLink && (
        <>
          <TextField
            label={t.email}
            icon="mail-outline"
            placeholder={t.emailPh}
            value={email}
            onChangeText={(v) => { setEmail(v); if (error) setError(null); }}
            keyboardType="email-address"
          />

          <TextField
            label={t.resetCode}
            icon="key-outline"
            placeholder={t.resetCodePh}
            value={code}
            onChangeText={(v) => { setCode(v.toUpperCase()); if (error) setError(null); }}
            autoCapitalize="characters"
          />
        </>
      )}

      {fromLink && (
        <View style={[styles.forRow, { backgroundColor: c.fieldBg }]}>
          <Text style={[styles.forLabel, { color: c.textMuted }]}>{t.email}</Text>
          <Text style={[styles.forValue, { color: c.text }]} numberOfLines={1}>{email}</Text>
        </View>
      )}

      <TextField
        label={t.newPassword}
        icon="lock-closed-outline"
        placeholder={t.passwordPh}
        value={password}
        onChangeText={(v) => { setPassword(v); if (error) setError(null); }}
        secure
      />

      <TextField
        label={t.confirmPassword}
        icon="lock-closed-outline"
        placeholder={t.passwordPh}
        value={confirm}
        onChangeText={(v) => { setConfirm(v); if (error) setError(null); }}
        secure
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {!!error && <ErrorRow message={error} />}

      <PrimaryButton
        label={t.resetTitle}
        onPress={submit}
        loading={resetting}
        disabled={!password || !confirm}
      />

      <AuthFooter
        prompt={t.rememberedIt}
        action={t.login}
        onPress={() => router.replace('/(auth)/login')}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4,
  },
  forLabel: { fontSize: 12.5, fontWeight: '700' },
  forValue: { flex: 1, fontSize: 14, fontWeight: '700', textAlign: 'right' },
});
