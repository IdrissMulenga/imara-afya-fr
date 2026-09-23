// Change password. The response is a new session: the old token stops working,
// so the new one is saved before anything else.
import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Field, PrimaryButton, ErrorNote, InfoNote } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { CHANGE_PASSWORD, type AuthPayload } from '@/graphql/auth';

const MIN_PASSWORD = 8;

export default function ChangePassword() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { signIn } = useSession();
  const notice = useNotice();

  const a = APP_COPY[lang];

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const [change, { loading }] = useMutation<{ changePassword: AuthPayload }>(CHANGE_PASSWORD);

  const longEnough = next.length >= MIN_PASSWORD;
  const matches = useMemo(() => confirm.length > 0 && next === confirm, [next, confirm]);
  const mismatch = confirm.length > 0 && !matches;

  // Only length and match are checked here; the backend checks the rest.
  const ready = longEnough && matches && current.length > 0;

  const submit = async () => {
    setError('');
    if (!ready) return;

    try {
      const { data } = await change({
        variables: { input: { currentPassword: current, newPassword: next } },
      });
      if (!data?.changePassword) return;

      // Save the new token first.
      await signIn(data.changePassword);

      notice.success(a.passwordChanged, t.signsOut);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          title={a.changePassword}
          subtitle={a.changePasswordNote}
          backLabel={t.back}
          onBack={() => router.back()}
        />
      }
    >

      <FadeIn delay={110}>
        <Glass style={{ padding: 18 }}>
          <View style={{ gap: 16 }}>
            <Field
              label={a.currentPassword}
              value={current}
              onChangeText={setCurrent}
              secure
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
            />
            <Field
              label={a.newPasswordLabel}
              value={next}
              onChangeText={setNext}
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />
            <Field
              label={a.confirmNewPassword}
              value={confirm}
              onChangeText={setConfirm}
              secure
              error={mismatch}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={ready ? submit : undefined}
            />

            <Text style={[T.fine, { color: longEnough ? c.success : c.faint }]}>{t.passwordRule}</Text>
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
      <PrimaryButton
        label={a.changePasswordCta}
        onPress={submit}
        busy={loading}
        disabled={!ready}
      />

      <Gap h={18} />
      <InfoNote>{t.signsOut}</InfoNote>

      <Spacer />
    </Screen>
  );
}
