// Profile: who the user is (photo, name, details, BMI), with a link to edit them.
import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { Section, FactRow, NavRow, Badge, Divider, IdentityCard } from '@/components/panel';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, ageFrom, bmiBand, shortDate } from '@/theme/copy-app';
import { useSession } from '@/lib/session';

export default function ProfileOverview() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, refreshUser } = useSession();
  const a = APP_COPY[lang];

  if (!user) return <Screen />;

  const age = ageFrom(user.birthDate);
  const band = bmiBand(user.bmi, a);
  const genderLabel =
    user.gender === 'female' ? t.genderFemale : user.gender === 'male' ? t.genderMale : t.genderUnspecified;
  const edit = () => router.push('/(app)/profile');

  return (
    <Screen
      header={<AppHeader title={a.menuProfile} backLabel={t.back} onBack={() => router.back()} />}
      onRefresh={refreshUser}
    >
      <FadeIn delay={60}>
        <IdentityCard
          name={user.name}
          email={user.email}
          photoUrl={user.photoUrl}
          action={a.personalDetails}
          onPress={edit}
          badge={
            user.emailVerified ? (
              <Badge text={a.verified} tone="good" />
            ) : (
              <Badge text={a.unverifiedShort} tone="bad" />
            )
          }
        />
      </FadeIn>

      <View style={{ height: 22 }} />

      <FadeIn delay={120}>
        <Section title={a.yourProfile}>
          <FactRow label={a.fullName} value={user.name || a.notSet} tone={user.name ? 'normal' : 'muted'} />
          <Divider />
          <FactRow label={a.emailAddress} value={user.email} />
          <FactRow
            label={a.verified}
            value={user.emailVerified ? '✓' : '—'}
            tone={user.emailVerified ? 'good' : 'bad'}
          />
          <Divider />
          <FactRow label={a.gender} value={genderLabel} />
          <FactRow
            label={a.age}
            value={age != null ? `${age} ${a.years}` : a.notSet}
            tone={age != null ? 'normal' : 'muted'}
          />
          <Divider />
          <FactRow
            label={a.height}
            value={user.heightCm != null ? `${user.heightCm}` : a.notSet}
            tone={user.heightCm != null ? 'normal' : 'muted'}
          />
          <FactRow
            label={a.weight}
            value={user.weightKg != null ? `${user.weightKg}` : a.notSet}
            tone={user.weightKg != null ? 'normal' : 'muted'}
          />
          <FactRow
            label={a.bmi}
            value={user.bmi != null ? String(user.bmi) : a.notSet}
            tone={user.bmi != null ? 'normal' : 'muted'}
          />

          {band ? (
            <View style={{ gap: 8 }}>
              <Badge text={band.text} tone={band.tone === 'ok' ? 'good' : 'neutral'} />
              <Text style={[T.fine, { color: c.faint }]}>{a.bmiNote}</Text>
            </View>
          ) : (
            <Text style={[T.fine, { color: c.faint }]}>{a.bmiUnknown}</Text>
          )}

          <Divider />
          <FactRow label={a.memberSince} value={shortDate(user.createdAt, lang) ?? '—'} tone="muted" />

          <Divider />
          <NavRow label={a.personalDetails} hint={a.personalDetailsSub} onPress={edit} />
        </Section>
      </FadeIn>
    </Screen>
  );
}
