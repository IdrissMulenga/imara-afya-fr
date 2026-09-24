// Profile: name, gender, birth date, height and weight, saved together from the footer.
// The photo saves on its own as soon as it is picked.
import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { Field, PrimaryButton, ErrorNote, ChoiceRow, LinkText, type Choice } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section, Badge, FactRow, Divider } from '@/components/panel';
import { AvatarPicker } from '@/components/avatar-picker';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, ageFrom, bmiBand } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { UPDATE_PROFILE, type AuthUser, type Gender } from '@/graphql/auth';

const textOf = (value: number | null | undefined): string => (value == null ? '' : String(value));

/** Blank clears the value (null); unparseable text leaves it unchanged (undefined). */
const numberOrNull = (raw: string): number | null | undefined => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function ProfileSettings() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, setUser } = useSession();
  const notice = useNotice();

  const a = APP_COPY[lang];

  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'unspecified');
  const [birthDate, setBirthDate] = useState(user?.birthDate ? user.birthDate.slice(0, 10) : '');
  const [heightCm, setHeightCm] = useState(textOf(user?.heightCm));
  const [weightKg, setWeightKg] = useState(textOf(user?.weightKg));

  const [error, setError] = useState('');

  const [updateProfile, { loading }] = useMutation<{ updateProfile: AuthUser }>(UPDATE_PROFILE);

  const genders: readonly Choice<Gender>[] = [
    { value: 'female', label: t.genderFemale },
    { value: 'male', label: t.genderMale },
    { value: 'unspecified', label: t.genderUnspecified },
  ];

  // Whether anything differs from the server values.
  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      name !== (user.name ?? '') ||
      gender !== user.gender ||
      birthDate !== (user.birthDate ? user.birthDate.slice(0, 10) : '') ||
      heightCm !== textOf(user.heightCm) ||
      weightKg !== textOf(user.weightKg)
    );
  }, [user, name, gender, birthDate, heightCm, weightKg]);

  // Labels of the changed fields, for the confirmation.
  const changed = useMemo((): string[] => {
    if (!user) return [];
    const list: string[] = [];
    if (name !== (user.name ?? '')) list.push(a.fullName);
    if (gender !== user.gender) list.push(a.gender);
    if (birthDate !== (user.birthDate ? user.birthDate.slice(0, 10) : '')) list.push(a.birthDate);
    if (heightCm !== textOf(user.heightCm)) list.push(a.height);
    if (weightKg !== textOf(user.weightKg)) list.push(a.weight);
    return list;
  }, [user, name, gender, birthDate, heightCm, weightKg, a]);

  const reset = () => {
    if (!user) return;
    setName(user.name ?? '');
    setGender(user.gender);
    setBirthDate(user.birthDate ? user.birthDate.slice(0, 10) : '');
    setHeightCm(textOf(user.heightCm));
    setWeightKg(textOf(user.weightKg));
    setError('');
  };

  if (!user) return <Screen />;

  const save = async () => {
    setError('');
    // Read before setUser replaces the values it compares against.
    const fields = changed;

    try {
      const height = numberOrNull(heightCm);
      const weight = numberOrNull(weightKg);

      const { data } = await updateProfile({
        variables: {
          input: {
            name: name.trim(),
            gender,
            birthDate: birthDate.trim() || null,
            ...(height !== undefined ? { heightCm: height } : {}),
            ...(weight !== undefined ? { weightKg: weight } : {}),
          },
        },
      });

      if (data?.updateProfile) {
        setUser(data.updateProfile);
        notice.success(a.saved, a.personalDetails);
        notice.toast(fields.length ? fields.join(' · ') : a.saved);
      }
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  const age = ageFrom(birthDate || user.birthDate);
  const band = bmiBand(user.bmi, a);

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {dirty ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[T.fine, { color: c.muted }]}>{a.unsaved}</Text>
              <LinkText label={a.discard} onPress={reset} />
            </View>
          ) : null}
          <PrimaryButton label={a.save} onPress={save} busy={loading} disabled={!dirty} />
        </View>
      }
      header={
        <AppHeader
          title={a.personalDetails}
          subtitle={a.personalDetailsSub}
          backLabel={t.back}
          onBack={() => router.back()}
        />
      }
    >

      <FadeIn delay={100}>
        <Section title={a.photo}>
          <AvatarPicker />
        </Section>
      </FadeIn>

      <Gap h={20} />

      <FadeIn delay={150}>
        <Section title={a.sectionProfile}>
          <Field
            label={a.fullName}
            value={name}
            onChangeText={setName}
            placeholder={t.nameHint}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={80}
          />

          <ChoiceRow<Gender>
            label={a.gender}
            options={genders}
            value={gender}
            onChange={setGender}
            hint={t.genderWhy}
          />

          {/* Typed date (YYYY-MM-DD) rather than a picker. */}
          <Field
            label={a.birthDate}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder={a.birthDateHint}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
          />
          {age != null ? (
            <Text style={[T.fine, { color: c.muted, marginTop: -8 }]}>
              {a.age}: {age} {a.years}
            </Text>
          ) : null}
        </Section>
      </FadeIn>

      <Gap h={20} />

      <FadeIn delay={200}>
        <Section title={`${a.height} · ${a.weight}`}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label={a.height}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="170"
                maxLength={5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={a.weight}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="65"
                maxLength={5}
              />
            </View>
          </View>

          <Divider />

          <FactRow label={a.bmi} value={user.bmi != null ? String(user.bmi) : a.notSet} />
          {band ? <Badge text={band.text} tone={band.tone === 'ok' ? 'good' : 'neutral'} /> : null}
          <Text style={[T.fine, { color: c.faint }]}>
            {user.bmi != null ? a.bmiNote : a.bmiUnknown}
          </Text>
        </Section>
      </FadeIn>

      {error ? (
        <View style={{ marginTop: 18 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

    </Screen>
  );
}
