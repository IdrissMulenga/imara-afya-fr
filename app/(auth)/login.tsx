// Login with email and password. An untrusted phone gets a code challenge instead of a token.
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Heading, Field, PrimaryButton, BackButton, ErrorNote, Footnote, LinkText } from '@/components/ui';
import { Wordmark } from '@/components/wordmark';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useSession } from '@/lib/session';
import { readError, errorWithWait, fieldOf, type FieldKey } from '@/lib/errors';
import { getDeviceId, getDeviceLabel } from '@/lib/device';
import { LOGIN, type LoginResult } from '@/graphql/auth';

export default function Login() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // One error at a time. field is null when it is about the whole form.
  const [error, setError] = useState('');
  const [field, setField] = useState<FieldKey>(null);

  const [login, { loading }] = useMutation<{ login: LoginResult }>(LOGIN);

  const submit = async () => {
    setError('');
    setField(null);

    // No client-side validation; the backend returns the errors.
    try {
      const [deviceId, deviceLabel] = [await getDeviceId(), getDeviceLabel()];
      const { data } = await login({
        variables: { input: { email: email.trim(), password, deviceId, deviceLabel } },
      });

      const result = data?.login;
      if (!result) return;

      if (result.__typename === 'AuthPayload') {
        await signIn(result);
        router.replace('/(app)');
        return;
      }

      // A code was emailed: continue to verify with the address and its masked form.
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email.trim(), masked: result.maskedEmail, purpose: 'LOGIN' },
      });
    } catch (e) {
      const failure = readError(e, lang);
      setError(errorWithWait(e, lang));
      setField(fieldOf(failure.code));
    }
  };

  return (
    <Screen>
      <FadeIn>
        <BackButton onPress={() => router.replace('/(auth)/welcome')} label={t.back} />
      </FadeIn>

      <Gap h={24} />
      <FadeIn delay={60}>
        <Wordmark />
      </FadeIn>
      <Gap h={22} />

      <FadeIn delay={110}>
        <Heading title={t.loginTitle} sub={t.loginSub} />
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={170}>
        <Glass style={{ padding: 18 }}>
          <View style={{ gap: 16 }}>
            <Field
              label={t.email}
              value={email}
              onChangeText={setEmail}
              errorText={field === 'email' ? error : undefined}
              placeholder={t.emailHint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <Field
              label={t.password}
              value={password}
              onChangeText={setPassword}
              errorText={field === 'password' ? error : undefined}
              secure
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </View>
        </Glass>
      </FadeIn>

      <FadeIn delay={220} style={{ alignItems: 'flex-end', marginTop: 12 }}>
        <LinkText label={t.forgot} onPress={() => router.push('/(auth)/forgot')} />
      </FadeIn>

      {/* Form-level errors (not tied to one field). */}
      {error && !field ? (
        <View style={{ marginTop: 16 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

      <Gap h={18} />
      <FadeIn delay={270}>
        <PrimaryButton label={t.loginCta} onPress={submit} busy={loading} />
      </FadeIn>

      <Spacer />
      <FadeIn delay={320}>
        <Footnote plain={t.noAccount} link={t.createOne} onPress={() => router.replace('/(auth)/signup')} />
      </FadeIn>
    </Screen>
  );
}
