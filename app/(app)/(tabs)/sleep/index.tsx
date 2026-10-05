// Sleep: last night's ring with −/+, the sleep schedule, automatic tracking, the 7-day average, a 14-day
// chart (tap it for the full chart) and the last 30 nights.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { ErrorNote, QuietButton } from '@/components/ui';
import { Pressable } from '@/components/pressable';
import { AppHeader } from '@/components/header';
import { Section } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { SleepRing, SLEEP_COLOR } from '@/components/habit-art';
import { HabitChart, HabitHistoryList, HabitStats } from '@/components/habit-history';
import { SleepButtons, SleepPrompt, useHabitSummary } from '@/components/habits';
import { SleepScheduleCard } from '@/components/sleep-schedule';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { useSteps } from '@/lib/steps-provider';
import { syncSleep } from '@/lib/sleep';
import { HABIT_HISTORY, type HabitDay } from '@/graphql/habits';

const hours = (day: HabitDay) => day.sleepHours ?? 0;
const formatHours = (n: number) => `${(Math.round(n * 4) / 4).toLocaleString()} h`;

export default function SleepScreen() {
  const router = useRouter();
  const { lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const { today: localDay, sleepSupported } = useSteps();
  const a = APP_COPY[lang];

  const summaryQuery = useHabitSummary();
  const historyQuery = useQuery<{ habitHistory: HabitDay[] }>(HABIT_HISTORY, { variables: { days: 30 } });

  if (!user) return <Screen />;

  const summary = summaryQuery.data?.habitSummary;
  const today = summary?.today ?? { day: localDay, waterGlasses: 0, steps: null, sleepHours: null };
  const slept = today.sleepHours ?? 0;
  const history = historyQuery.data?.habitHistory ?? [];
  const goal = user.sleepGoalHours;
  const met = goal > 0 && slept >= goal && !today.sleepEstimated;
  const streak = summary?.streaks.sleep ?? 0;

  return (
    <Screen
      onRefresh={() => Promise.all([syncSleep(), summaryQuery.refetch(), historyQuery.refetch()])}
      header={<AppHeader title={a.sleepLabel} subtitle={a.sleepSub} />}
      tabbed
    >
      <FadeIn>
        <Glass style={{ padding: 20 }}>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <Text style={[T.label, { color: c.faint }]}>{a.lastNight.toUpperCase()}</Text>
            <SleepRing hours={slept} goal={goal} size={220} stroke={16} />
            {today.sleepHours == null ? (
              <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]}>{a.sleepNoDataNote}</Text>
            ) : null}
            {met ? <Text style={[T.fine, { color: c.success }]}>{a.goalMet}</Text> : null}
            <SleepButtons day={today.day} hours={slept} />
            <View style={styles.statsRow}>
              <MiniStat
                icon="fire"
                value={String(streak)}
                caption={a.streakLabel}
                tint={streak > 0 ? '#E8772E' : c.faint}
              />
              <MiniStat
                icon="power-sleep"
                value={`${goal > 0 ? Math.min(999, Math.round((slept / goal) * 100)) : 0}%`}
                caption={a.ofGoal}
                tint={SLEEP_COLOR}
              />
            </View>
          </View>
        </Glass>
      </FadeIn>

      <Gap h={18} />
      <FadeIn delay={40}>
        <SleepScheduleCard />
      </FadeIn>

      {sleepSupported ? (
        <>
          <Gap h={18} />
          <FadeIn delay={60}>
            <Section title={a.autoTracking}>
              <SleepPrompt />
            </Section>
          </FadeIn>
        </>
      ) : null}

      {historyQuery.error && !history.length ? (
        <>
          <Gap h={18} />
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void historyQuery.refetch()} />
        </>
      ) : null}

      {history.length ? (
        <>
          <Gap h={18} />
          <FadeIn delay={110}>
            <HabitStats days={history} value={hours} format={formatHours} bestCaption={a.longestNight} tint={SLEEP_COLOR} />
          </FadeIn>
          <Gap h={18} />
          <FadeIn delay={160}>
            <Section title={a.last14Days}>
              <Pressable
                ripple="none"
                onPress={() => router.push('/sleep-history')}
                accessibilityRole="button"
                accessibilityLabel={a.seeFullChart}
              >
                <View pointerEvents="none">
                  <HabitChart days={history.slice(0, 14).reverse()} goal={goal} value={hours} color={SLEEP_COLOR} />
                </View>
              </Pressable>
              <QuietButton label={a.seeFullChart} onPress={() => router.push('/sleep-history')} />
            </Section>
          </FadeIn>
          <Gap h={18} />
          <FadeIn delay={210}>
            <HabitHistoryList title={a.stepsHistory} days={history} goal={goal} value={hours} format={formatHours} />
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around' },
});
