import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import TextField from '@/components/text-field';
import { PrimaryButton } from '@/components/buttons';
import { AuthShell, AuthFooter, ErrorRow } from '@/components/auth-shell';
import { errorMessage } from '@/lib/errors';
import usePassword from '@/hooks/use-password';

// deliberately loose — the backend does the real check, and a regex that
// rejects a valid address is worse than one that lets a typo through
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function ForgotPasswordScreen() {
  const { c } = useTheme();
  const { t } = useStrings();

  const { requestReset, sending } = usePassword();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const value = email.trim().toLowerCase();

    if (!EMAIL_RE.test(value)) {
      setError(t.errEmail);
      return;
    }

    setError(null);

    try {
      await requestReset(value);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, t.errGeneric));
    }
  };

  // CONFIRMATION, not success. We genuinely don't know whether an email went
  // anywhere, and shouldn't imply we do.
  if (sent) {
    return (
      <AuthShell title={t.checkInbox} subtitle={t.checkInboxSub}>
        <View style={[styles.sentCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.sentIcon, { backgroundColor: c.ring }]}>
            <Ionicons name="mail-outline" size={26} color={c.primary} />
          </View>

          <Text style={[styles.sentEmail, { color: c.text }]}>{email.trim().toLowerCase()}</Text>
          <Text style={[styles.sentHint, { color: c.textMuted }]}>{t.resetLinkHint}</Text>
        </View>

        {/* the link may not survive every email client, so the manual route
            has to be one tap away rather than a thing to go hunting for */}
        <PrimaryButton
          label={t.enterCodeInstead}
          onPress={() => router.push({
            pathname: '/(auth)/reset-password',
            params: { email: email.trim().toLowerCase() },
          })}
        />

        <AuthFooter
          prompt={t.rememberedIt}
          action={t.login}
          onPress={() => router.replace('/(auth)/login')}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t.forgotTitle} subtitle={t.forgotSub}>
      <TextField
        label={t.email}
        icon="mail-outline"
        placeholder={t.emailPh}
        value={email}
        onChangeText={(v) => { setEmail(v); if (error) setError(null); }}
        keyboardType="email-address"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {!!error && <ErrorRow message={error} />}

      <PrimaryButton
        label={t.sendResetLink}
        onPress={submit}
        loading={sending}
        disabled={!email.trim()}
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
  sentCard: {
    borderWidth: 1, borderRadius: 20, padding: 22,
    alignItems: 'center', marginBottom: 18,
  },
  sentIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  sentEmail: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  sentHint: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 8, lineHeight: 19 },
});
