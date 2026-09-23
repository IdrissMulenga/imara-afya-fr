// Request a reset code. The server always returns true, so this always moves on to verify.
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Heading, Field, PrimaryButton, BackButton, ErrorNote, InfoNote, Footnote } from '@/components/ui';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { readError, errorWithWait, fieldOf, type FieldKey } from '@/lib/errors';
import { REQUEST_PASSWORD_RESET } from '@/graphql/auth';

export default function Forgot() {
  const router = useRouter();
  const { t, lang } = useLang();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [field, setField] = useState<FieldKey>(null);

  const [request, { loading }] = useMutation<{ requestPasswordReset: boolean }>(REQUEST_PASSWORD_RESET);

  const submit = async () => {
    setError('');
    setField(null);
    const address = email.trim();

    try {
      await request({ variables: { email: address } });
      router.push({ pathname: '/(auth)/verify', params: { email: address, purpose: 'RESET' } });
    } catch (e) {
      // Only network or rate-limit failures land here.
      const failure = readError(e, lang);
      setError(errorWithWait(e, lang));
      setField(fieldOf(failure.code));
    }
  };

  return (
    <Screen>
      <FadeIn>
        <BackButton onPress={() => router.back()} label={t.back} />
      </FadeIn>

      <Gap h={26} />
      <FadeIn delay={70}>
        <Heading eyebrow="1 / 3" title={t.forgotTitle} sub={t.forgotSub} />
      </FadeIn>

      <Gap h={24} />
      <FadeIn delay={130}>
        <Glass style={{ padding: 18 }}>
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
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </Glass>
      </FadeIn>

      {error && !field ? (
        <View style={{ marginTop: 16 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

      <Gap h={22} />
      <FadeIn delay={190}>
        <PrimaryButton label={t.forgotCta} onPress={submit} busy={loading} />
      </FadeIn>

      <Gap h={20} />
      <FadeIn delay={240}>
        <InfoNote>{t.privacyNote}</InfoNote>
      </FadeIn>

      <Spacer />
      <FadeIn delay={290}>
        <Footnote plain={t.remembered} link={t.signIn} onPress={() => router.replace('/(auth)/login')} />
      </FadeIn>
    </Screen>
  );
}
