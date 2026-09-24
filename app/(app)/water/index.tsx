// Water: today's glass with −/+, reminders, the 7-day average, a 14-day chart and
// the last 30 days.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { ErrorNote, QuietButton } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section, SwitchRow } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { MiniStat } from '@/components/steps-ring';
import { WaterGlass, WATER_COLOR } from '@/components/habit-art';
import { HabitChart, HabitHistoryList, HabitStats } from '@/components/habit-history';
import { WaterButtons, useHabitSummary } from '@/components/habits';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { useSteps } from '@/lib/steps-provider';
import { useWaterReminders } from '@/lib/water-reminders';
import { HABIT_HISTORY, type HabitDay } from '@/graphql/habits';

const glasses = (day: HabitDay) => day.waterGlasses;
const formatGlasses = (n: number) => (Math.round(n * 10) / 10).toLocaleString();

export default function WaterScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const { today: localDay } = useSteps();
  const notice = useNotice();
  const reminders = useWaterReminders();
  const a = APP_COPY[lang];

  const summaryQuery = useHabitSummary();
  const historyQuery = useQuery<{ habitHistory: HabitDay[] }>(HABIT_HISTORY, { variables: { days: 30 } });

  if (!user) return <Screen />;

  const summary = summaryQuery.data?.habitSummary;
  const today = summary?.today ?? { day: localDay, waterGlasses: 0, steps: 0, sleepHours: 0 };
  const history = historyQuery.data?.habitHistory ?? [];
  const goal = user.waterGoalGlasses;
  const met = goal > 0 && today.waterGlasses >= goal;
  const streak = summary?.streaks.water ?? 0;

  return (
    <Screen
      onRefresh={() => Promise.all([summaryQuery.refetch(), historyQuery.refetch()])}
      header={<AppHeader title={a.waterLabel} subtitle={a.waterSub} backLabel={t.back} onBack={() => router.back()} />}
    >
      <FadeIn>
        <Glass style={{ padding: 20 }}>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <WaterGlass fill={goal > 0 ? today.waterGlasses / goal : 0} width={120} height={160} />
            <Text style={{ fontFamily: font.displayBold, fontSize: 38, color: met ? c.success : c.text }}>
              {formatGlasses(today.waterGlasses)}
              <Text style={[T.sub, { color: c.muted }]}>
                {' '}
                / {goal} {a.glasses}
              </Text>
            </Text>
            {met ? <Text style={[T.fine, { color: c.success }]}>{a.goalMet}</Text> : null}
            <WaterButtons day={today.day} glasses={today.waterGlasses} />
            <View style={styles.statsRow}>
              <MiniStat
                icon="fire"
                value={String(streak)}
                caption={a.streakLabel}
                tint={streak > 0 ? '#E8772E' : c.faint}
              />
              <MiniStat
                icon="cup-water"
                value={`${goal > 0 ? Math.min(999, Math.round((today.waterGlasses / goal) * 100)) : 0}%`}
                caption={a.ofGoal}
                tint={WATER_COLOR}
              />
            </View>
          </View>
        </Glass>
      </FadeIn>

      {reminders.supported ? (
        <>
          <Gap h={18} />
          <FadeIn delay={60}>
            <Section title={a.remindersSection}>
              <SwitchRow
                label={a.waterReminders}
                hint={a.waterRemindersNote}
                value={reminders.enabled}
                onChange={(on) => {
                  if (!on) {
                    void reminders.disable();
                    return;
                  }
                  void reminders.enable().then((result) => {
                    if (result === 'enabled') notice.success(a.remindersOn, a.waterRemindersNote);
                    else notice.failure(a.waterReminders, a.notificationsDenied);
                  });
                }}
              />
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
            <HabitStats days={history} value={glasses} format={formatGlasses} bestCaption={a.mostWater} tint={WATER_COLOR} />
          </FadeIn>
          <Gap h={18} />
          <FadeIn delay={160}>
            <Section title={a.last14Days}>
              <HabitChart days={history.slice(0, 14).reverse()} goal={goal} value={glasses} color={WATER_COLOR} />
            </Section>
          </FadeIn>
          <Gap h={18} />
          <FadeIn delay={210}>
            <HabitHistoryList title={a.stepsHistory} days={history} goal={goal} value={glasses} format={formatGlasses} />
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around' },
});
