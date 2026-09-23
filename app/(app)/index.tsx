// Dashboard: the profile and the goals the user set. No tracking data exists yet.
import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Heading, PrimaryButton, QuietButton } from '@/components/ui';
import { Section, FactRow, NavRow, Stat, Badge, Divider } from '@/components/panel';
import { ProfileHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, greetingFor, ageFrom, bmiBand, shortDate } from '@/theme/copy-app';
import { useSession } from '@/lib/session';

// A number as text, or a dash when missing.
const num = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '—';

export default function Dashboard() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, signOut } = useSession();

  const a = APP_COPY[lang];

  // The user can be null briefly while signing out.
  if (!user) return <Screen />;

  const age = ageFrom(user.birthDate);
  const band = bmiBand(user.bmi, a);
  const genderLabel =
    user.gender === 'female' ? t.genderFemale : user.gender === 'male' ? t.genderMale : t.genderUnspecified;

  const firstName = (user.name || '').trim().split(/\s+/)[0] || '';

  return (
    <Screen
      header={
        <ProfileHeader
          greeting={`${greetingFor(a)}${firstName ? ',' : ''}`}
          name={user.name}
          email={user.email}
          photoUrl={user.photoUrl}
          action={a.personalDetails}
          onPress={() => router.push('/(app)/profile')}
          badge={
            !user.emailVerified ? <Badge text={a.unverifiedShort} tone="bad" /> : undefined
          }
        />
      }
    >
      <FadeIn>
        <Text style={[T.sub, { color: c.muted, maxWidth: 330 }]}>{a.dashSub}</Text>
      </FadeIn>

      {!user.emailVerified ? (
        <FadeIn delay={110}>
          <Gap h={18} />
          <Glass style={{ padding: 16 }}>
            <View style={{ gap: 12 }}>
              <Badge text={a.unverifiedShort} tone="bad" />
              <Text style={[T.body, { color: c.muted }]}>{t.unverified}</Text>
              <QuietButton
                label={a.confirmNow}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/verify',
                    params: { email: user.email, masked: user.email, purpose: 'SIGNUP' },
                  })
                }
              />
            </View>
          </Glass>
        </FadeIn>
      ) : null}

      <Gap h={22} />

      {/* Goals (targets, not progress). */}
      <FadeIn delay={160}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat value={num(user.stepGoal)} caption={a.steps} />
          <Stat value={num(user.waterGoalGlasses)} caption={a.glasses} />
          <Stat value={num(user.sleepGoalHours)} caption={a.hours} />
        </View>
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={210}>
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
          <NavRow
            label={a.personalDetails}
            hint={a.personalDetailsSub}
            onPress={() => router.push('/(app)/profile')}
          />
        </Section>
      </FadeIn>

      <Gap h={18} />

      <FadeIn delay={260}>
        <Glass style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <NavRow label={a.openSettings} hint={a.settingsSub} onPress={() => router.push('/(app)/settings')} />
        </Glass>
      </FadeIn>

      <Spacer />
      <Gap h={20} />
      <FadeIn delay={310}>
        <PrimaryButton label={t.signOut} onPress={signOut} />
      </FadeIn>
    </Screen>
  );
}
