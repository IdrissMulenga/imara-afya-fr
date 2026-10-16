// Delete account: its own screen, typing DELETE (translated), and the account password. An account
// made with Google or Apple confirms by signing in with them again instead.
// The backend deletes the account, its trusted devices and codes.
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Field, PrimaryButton, QuietButton, ErrorNote } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font, radius } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { clearQueue } from '@/lib/offline-queue';
import { DELETE_ACCOUNT } from '@/graphql/auth';
import { useErrorBanner } from '@/components/notice';
import { appleAvailable, appleCredential, googleAvailable, googleIdToken } from '@/lib/social';

export default function DeleteAccount() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, forgetSession } = useSession();

  const a = APP_COPY[lang];

  const [password, setPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  useErrorBanner(error);

  const [remove, { loading }] = useMutation<{ deleteAccount: boolean }>(DELETE_ACCOUNT);

  const wordMatches = typed.trim().toUpperCase() === a.deleteTypeWord.toUpperCase();
  const ready = wordMatches && password.length > 0;

  // Accounts made with Google or Apple have no password; they confirm with that provider.
  const viaProvider = user?.hasPassword === false;
  const methods = user?.signInMethods ?? [];
  const linkedApple = methods.includes('APPLE');
  const [apple, setApple] = useState(false);
  useEffect(() => {
    if (!linkedApple) return;
    let alive = true;
    appleAvailable().then((ok) => {
      if (alive) setApple(ok);
    });
    return () => {
      alive = false;
    };
  }, [linkedApple]);
  const google = methods.includes('GOOGLE') && googleAvailable();

  type Proof = { password: string } | { googleIdToken: string } | { apple: { identityToken: string; nonce: string } };

  const erase = async (proof: Proof) => {
    try {
      const { data } = await remove({ variables: { input: proof } });
      if (!data?.deleteAccount) return;

      // Clear locally only; logout would fail because the account no longer exists. Entries saved
      // offline for this account are dropped with it.
      await clearQueue();
      await forgetSession();
      router.replace('/(auth)/welcome');
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  const submit = async () => {
    setError('');
    if (!ready) return;
    await erase({ password });
  };

  const confirmWith = async (provider: 'google' | 'apple') => {
    setError('');
    if (!wordMatches) return;
    try {
      if (provider === 'google') {
        const idToken = await googleIdToken();
        if (idToken) await erase({ googleIdToken: idToken });
      } else {
        const credential = await appleCredential();
        if (credential) {
          await erase({ apple: { identityToken: credential.identityToken, nonce: credential.nonce } });
        }
      }
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  return (
    <Screen
      header={
        <AppHeader title={a.deleteAccount} backLabel={t.back} onBack={() => router.back()} />
      }
    >

      <FadeIn delay={110}>
        <View
          style={{
            borderWidth: 1,
            borderColor: c.danger,
            backgroundColor: c.dangerBg,
            borderRadius: radius.card,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: c.danger }}>
            {a.deleteAccountNote}
          </Text>
          <Text style={[T.body, { color: c.danger }]}>{a.deleteWarning}</Text>
        </View>
      </FadeIn>

      <Gap h={20} />

      <FadeIn delay={160}>
        <Glass style={{ padding: 18 }}>
          <View style={{ gap: 16 }}>
            {user ? (
              <Text style={[T.fine, { color: c.muted }]}>{user.email}</Text>
            ) : null}

            <Field
              label={a.deleteTypeLabel}
              value={typed}
              onChangeText={setTyped}
              placeholder={a.deleteTypeWord}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {viaProvider ? (
              <Text style={[T.body, { color: c.muted }]}>{a.deleteProviderNote}</Text>
            ) : (
              <Field
                label={a.deleteConfirmLabel}
                value={password}
                onChangeText={setPassword}
                secure
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={ready ? submit : undefined}
              />
            )}
          </View>
        </Glass>
      </FadeIn>

      {error ? (
        <View style={{ marginTop: 16 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

      <Gap h={22} />
      {viaProvider ? (
        <View style={{ gap: 12 }}>
          {google ? (
            <PrimaryButton
              label={a.deleteConfirmGoogle}
              onPress={() => confirmWith('google')}
              busy={loading}
              disabled={!wordMatches}
            />
          ) : null}
          {apple ? (
            <QuietButton label={a.deleteConfirmApple} onPress={() => confirmWith('apple')} />
          ) : null}
        </View>
      ) : (
        <PrimaryButton label={a.deleteCta} onPress={submit} busy={loading} disabled={!ready} />
      )}

      <Spacer />
    </Screen>
  );
}
