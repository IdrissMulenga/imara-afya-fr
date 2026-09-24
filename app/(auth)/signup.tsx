// Sign-up: name, email, password, gender and terms.
// Name and gender are saved with updateProfile right after signup; if that fails
// the account still works. Terms acceptance is not stored on the server.
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import {
  Heading,
  Field,
  PrimaryButton,
  BackButton,
  ErrorNote,
  Footnote,
  ChoiceRow,
  CheckRow,
  type Choice,
} from '@/components/ui';
import { Glass } from '@/components/glass';
import { Wordmark } from '@/components/wordmark';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { useSession } from '@/lib/session';
import { readError, errorWithWait, fieldOf, type FieldKey } from '@/lib/errors';
import { getDeviceId, getDeviceLabel } from '@/lib/device';
import { SIGNUP, UPDATE_PROFILE, type AuthPayload, type AuthUser, type Gender } from '@/graphql/auth';

const MIN_PASSWORD = 8;

// Password strength, 0 to 4.
function strengthOf(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= MIN_PASSWORD) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function Signup() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { signIn, setUser } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [field, setField] = useState<FieldKey>(null);

  const [signup, { loading }] = useMutation<{ signup: AuthPayload }>(SIGNUP);
  const [updateProfile] = useMutation<{ updateProfile: AuthUser }>(UPDATE_PROFILE);

  const score = useMemo(() => strengthOf(password), [password]);
  const longEnough = password.length >= MIN_PASSWORD;

  // Only the terms box gates the button; everything else is validated by the backend.
  const ready = accepted;

  const genders: readonly Choice<Gender>[] = [
    { value: 'female', label: t.genderFemale },
    { value: 'male', label: t.genderMale },
    { value: 'unspecified', label: t.genderUnspecified },
  ];

  const submit = async () => {
    setError('');
    setField(null);
    try {
      const [deviceId, deviceLabel] = [await getDeviceId(), getDeviceLabel()];
      const { data } = await signup({
        variables: {
          input: { email: email.trim(), password, deviceId, deviceLabel, language: lang },
        },
      });
      if (!data?.signup) return;

      // Save the token first so updateProfile is authenticated.
      await signIn(data.signup);

      // Only fields that were filled in are sent.
      const profileInput: { name?: string; gender?: Gender } = {};
      if (name.trim()) profileInput.name = name.trim();
      if (gender) profileInput.gender = gender;

      if (Object.keys(profileInput).length > 0) {
        try {
          const profile = await updateProfile({ variables: { input: profileInput } });
          if (profile.data?.updateProfile) setUser(profile.data.updateProfile);
        } catch {
          // ignore
        }
      }

      router.replace('/(app)/dashboard');
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
        <Heading title={t.signupTitle} sub={t.signupSub} />
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={170}>
        <Glass style={{ padding: 18 }}>
          <View style={{ gap: 16 }}>
            <Field
              label={t.nameLabel}
              value={name}
              onChangeText={setName}
              placeholder={t.nameHint}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={80}
              returnKeyType="next"
            />

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
              label={t.choosePassword}
              value={password}
              onChangeText={setPassword}
              errorText={field === 'password' ? error : undefined}
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />

            {/* Password strength meter. */}
            <View style={{ gap: 8, marginTop: -4 }}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: i < score ? c.successMark : c.track,
                    }}
                  />
                ))}
              </View>
              <Text style={[T.fine, { color: longEnough ? c.success : c.faint }]}>
                {t.passwordRule}
              </Text>
            </View>

            <ChoiceRow<Gender>
              label={t.genderLabel}
              options={genders}
              value={gender}
              onChange={setGender}
              hint={t.genderWhy}
            />
          </View>
        </Glass>
      </FadeIn>

      <Gap h={18} />

      <FadeIn delay={220}>
        <CheckRow
          checked={accepted}
          onToggle={() => setAccepted((v) => !v)}
          accessibilityLabel={`${t.termsPrefix} ${t.termsLink} ${t.termsMiddle} ${t.privacyLink}`}
        >
          <Text style={[T.body, { color: c.muted }]}>
            {t.termsPrefix}{' '}
            <Text
              style={{ color: c.primary, fontFamily: font.bodySemi }}
              onPress={() => router.push({ pathname: '/(auth)/legal', params: { doc: 'terms' } })}
            >
              {t.termsLink}
            </Text>{' '}
            {t.termsMiddle}{' '}
            <Text
              style={{ color: c.primary, fontFamily: font.bodySemi }}
              onPress={() => router.push({ pathname: '/(auth)/legal', params: { doc: 'privacy' } })}
            >
              {t.privacyLink}
            </Text>
          </Text>
        </CheckRow>
      </FadeIn>

      {error && !field ? (
        <View style={{ marginTop: 16 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

      <Gap h={22} />
      <FadeIn delay={270}>
        <PrimaryButton label={t.signupCta} onPress={submit} busy={loading} disabled={!ready} />
      </FadeIn>

      <Gap h={14} />
      <FadeIn delay={310}>
        <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]}>{t.afterSignup}</Text>
      </FadeIn>

      <Spacer />
      <FadeIn delay={350}>
        <Footnote plain={t.haveAccount} link={t.signIn} onPress={() => router.replace('/(auth)/login')} />
      </FadeIn>
    </Screen>
  );
}
