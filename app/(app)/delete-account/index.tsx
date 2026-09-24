// Delete account: its own screen, typing DELETE (translated), and the account password.
// The backend deletes the account, its trusted devices and codes.
import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Field, PrimaryButton, ErrorNote } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font, radius } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { DELETE_ACCOUNT } from '@/graphql/auth';

export default function DeleteAccount() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, forgetSession } = useSession();

  const a = APP_COPY[lang];

  const [password, setPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');

  const [remove, { loading }] = useMutation<{ deleteAccount: boolean }>(DELETE_ACCOUNT);

  const wordMatches = typed.trim().toUpperCase() === a.deleteTypeWord.toUpperCase();
  const ready = wordMatches && password.length > 0;

  const submit = async () => {
    setError('');
    if (!ready) return;

    try {
      const { data } = await remove({ variables: { input: { password } } });
      if (!data?.deleteAccount) return;

      // Clear locally only; logout would fail because the account no longer exists.
      await forgetSession();
      router.replace('/(auth)/welcome');
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
          </View>
        </Glass>
      </FadeIn>

      {error ? (
        <View style={{ marginTop: 16 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

      <Gap h={22} />
      <PrimaryButton label={a.deleteCta} onPress={submit} busy={loading} disabled={!ready} />

      <Spacer />
    </Screen>
  );
}
