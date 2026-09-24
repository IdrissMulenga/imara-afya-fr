// Set a new password with the reset ticket from the verify screen.
// Returns a session; all other trusted devices are revoked.
import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Heading, Field, PrimaryButton, BackButton, ErrorNote } from '@/components/ui';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { getDeviceId, getDeviceLabel } from '@/lib/device';
import { RESET_PASSWORD, type AuthPayload } from '@/graphql/auth';

const MIN_PASSWORD = 8;

export default function Reset() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { signIn } = useSession();

  const { resetToken } = useLocalSearchParams<{ resetToken?: string }>();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const [reset, { loading }] = useMutation<{ resetPassword: AuthPayload }>(RESET_PASSWORD);

  const longEnough = password.length >= MIN_PASSWORD;
  const matches = useMemo(
    () => confirm.length > 0 && password === confirm,
    [password, confirm],
  );
  const mismatch = confirm.length > 0 && !matches;

  const submit = async () => {
    setError('');
    if (!resetToken) {
      // No ticket: start again from forgot.
      router.replace('/(auth)/forgot');
      return;
    }

    try {
      const [deviceId, deviceLabel] = [await getDeviceId(), getDeviceLabel()];
      const { data } = await reset({
        variables: { input: { resetToken, password, deviceId, deviceLabel } },
      });
      if (!data?.resetPassword) return;

      await signIn(data.resetPassword);
      router.replace('/(app)/dashboard');
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  return (
    <Screen>
      <FadeIn>
        <BackButton onPress={() => router.replace('/(auth)/login')} label={t.back} />
      </FadeIn>

      <Gap h={26} />
      <FadeIn delay={70}>
        <Heading eyebrow="3 / 3" title={t.resetTitle} sub={t.resetSub} />
      </FadeIn>

      <Gap h={24} />
      <FadeIn delay={130}>
        <Glass style={{ padding: 18 }}>
          <View style={{ gap: 16 }}>
            <Field
              label={t.newPassword}
              value={password}
              onChangeText={setPassword}
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />
            <Field
              label={t.confirmPassword}
              value={confirm}
              onChangeText={setConfirm}
              secure
              error={mismatch}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={matches && longEnough ? submit : undefined}
            />

            <Text style={[T.fine, { color: c.faint }]}>{t.passwordRule}</Text>
          </View>
        </Glass>
      </FadeIn>

      {confirm.length > 0 ? (
        <FadeIn from={-4} duration={200} style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: matches ? c.successMark : c.danger,
              }}
            />
            <Text style={[T.fine, { color: matches ? c.success : c.danger }]}>
              {matches ? t.match : t.noMatch}
            </Text>
          </View>
        </FadeIn>
      ) : null}

      {error ? (
        <View style={{ marginTop: 16 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

      <Gap h={22} />
      <FadeIn delay={190}>
        <PrimaryButton
          label={t.resetCta}
          onPress={submit}
          busy={loading}
          disabled={!longEnough || !matches}
        />
      </FadeIn>

      <Gap h={14} />
      <FadeIn delay={240}>
        <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]}>{t.signsOut}</Text>
      </FadeIn>

      <Spacer />
    </Screen>
  );
}
