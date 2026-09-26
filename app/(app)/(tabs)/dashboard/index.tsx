// Dashboard: the date, today at a glance (steps, water, sleep and mood rings), then
// sections for how you feel (check-in), activity (steps) and water and sleep.
import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { QuietButton } from '@/components/ui';
import { Badge } from '@/components/panel';
import { SleepTile, StepsPrompt, WaterTile, useHabitSummary } from '@/components/habits';
import { StepsHero } from '@/components/steps-ring';
import { CheckInCard, useCheckInSummary } from '@/components/checkin';
import { TodayGlance } from '@/components/today-glance';
import { ProfileHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, greetingFor } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { useSteps, useTodaySteps } from '@/lib/steps-provider';
import { syncHealth } from '@/lib/sync';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// "Friday 25 September" in the app's language.
const todayLabel = (lang: Lang): string => {
  try {
    return new Date().toLocaleDateString(lang === 'rn' ? 'fr' : lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return '';
  }
};

// A small heading above a group of cards.
function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <MaterialCommunityIcons name={icon} size={15} color={c.faint} />
      <Text style={[T.label, { color: c.faint }]}>{title}</Text>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, refreshUser } = useSession();
  const { today: localDay } = useSteps();

  const a = APP_COPY[lang];

  const { data: habits, refetch: refetchHabits } = useHabitSummary();
  const { data: checkIn, refetch: refetchCheckIn } = useCheckInSummary();
  const summary = habits?.habitSummary;
  const steps = useTodaySteps(summary?.today);

  // Refresh on return to this screen (skipping the first focus, which already fetched),
  // so the day rolls over after midnight.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) {
        void refetchHabits();
        void refetchCheckIn();
      }
      focusedOnce.current = true;
    }, [refetchHabits, refetchCheckIn]),
  );

  // The user can be null briefly while signing out.
  if (!user) return <Screen />;

  const firstName = (user.name || '').trim().split(/\s+/)[0] || '';
  const today = summary?.today ?? { day: localDay, waterGlasses: 0, steps: 0, sleepHours: 0 };
  const latest = checkIn?.checkInSummary.latest ?? null;

  return (
    <Screen
      onRefresh={() => Promise.all([refetchHabits(), refetchCheckIn(), syncHealth(), refreshUser()])}
      header={
        <ProfileHeader
          greeting={`${greetingFor(a)}${firstName ? ',' : ''}`}
          name={user.name}
          email={user.email}
          photoUrl={user.photoUrl}
          action={a.menuProfile}
          onPress={() => router.push('/me')}
          badge={!user.emailVerified ? <Badge text={a.unverifiedShort} tone="bad" /> : undefined}
        />
      }
      tabbed
    >
      <FadeIn>
        <Text style={[styles.date, { color: c.text }]}>{todayLabel(lang)}</Text>
        <Text style={[T.fine, { color: c.muted, marginTop: 2 }]}>{a.dashSub}</Text>
      </FadeIn>

      {!user.emailVerified ? (
        <FadeIn delay={60}>
          <Gap h={16} />
          <Glass style={{ padding: 14 }}>
            <View style={styles.verify}>
              <MaterialCommunityIcons name="email-alert-outline" size={22} color={c.danger} />
              <Text style={[T.fine, { color: c.muted, flex: 1 }]}>{t.unverified}</Text>
            </View>
            <Gap h={10} />
            <QuietButton
              label={a.confirmNow}
              onPress={() =>
                router.push({
                  pathname: '/(auth)/verify',
                  params: { email: user.email, masked: user.email, purpose: 'SIGNUP' },
                })
              }
            />
          </Glass>
        </FadeIn>
      ) : null}

      <Gap h={16} />
      <FadeIn delay={90}>
        <TodayGlance
          user={user}
          steps={steps}
          water={today.waterGlasses}
          sleep={today.sleepHours}
          mood={latest}
        />
      </FadeIn>

      <FadeIn delay={140}>
        <SectionTitle icon="heart-pulse" title={a.sectionFeel} />
        <CheckInCard summary={checkIn?.checkInSummary} />
      </FadeIn>

      <FadeIn delay={190}>
        <SectionTitle icon="walk" title={a.sectionActivity} />
        <StepsHero
          steps={steps}
          goal={user.stepGoal}
          streakDays={summary?.streaks.steps ?? 0}
          onPress={() => router.push('/(app)/steps')}
          footer={<StepsPrompt />}
        />
      </FadeIn>

      <FadeIn delay={240}>
        <SectionTitle icon="water-outline" title={a.sectionWaterSleep} />
        <View style={{ gap: 12 }}>
          <WaterTile user={user} today={today} streak={summary?.streaks.water} />
          <SleepTile user={user} today={today} streak={summary?.streaks.sleep} />
        </View>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { fontFamily: font.displayBold, fontSize: 22, textTransform: 'capitalize' },
  verify: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 26, marginBottom: 10, marginLeft: 2 },
});
