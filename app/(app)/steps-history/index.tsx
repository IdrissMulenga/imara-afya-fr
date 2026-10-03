// Steps chart: every day over 14, 30 or 90 days as a scrollable bar chart, with the average
// day, days at goal, the best day, and the day-by-day list. Opened from the steps page.
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ChoiceRow, ErrorNote, QuietButton } from '@/components/ui';
import { Section } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { HabitHistoryList } from '@/components/habit-history';
import { HabitTrendChart } from '@/components/habit-trend';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { useTodaySteps } from '@/lib/steps-provider';
import { syncSteps } from '@/lib/steps';
import { HABIT_HISTORY, type HabitDay } from '@/graphql/habits';

type Range = '14' | '30' | '90';
const RANGES: Range[] = ['14', '30', '90'];

const stepsOf = (day: HabitDay) => day.steps ?? 0;
const formatSteps = (n: number) => Math.round(n).toLocaleString();

export default function StepsHistoryScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const a = APP_COPY[lang];
  const [range, setRange] = useState<Range>('30');

  const query = useQuery<{ habitHistory: HabitDay[] }>(HABIT_HISTORY, {
    variables: { days: Number(range) },
  });
  const todaySteps = useTodaySteps(query.data?.habitHistory[0]);

  // Newest first, with today's value replaced by the live count.
  const days = useMemo(() => {
    const list = query.data?.habitHistory ?? [];
    return list.map((entry, i) =>
      i === 0 && todaySteps > (entry.steps ?? 0) ? { ...entry, steps: todaySteps } : entry,
    );
  }, [query.data, todaySteps]);

  if (!user) return <Screen />;

  const goal = user.stepGoal;
  // Days not yet synced are left out of the average, not counted as no steps.
  const logged = days.filter((d) => d.steps != null);
  const average = logged.length ? logged.reduce((sum, d) => sum + stepsOf(d), 0) / logged.length : 0;
  const atGoal = goal > 0 ? logged.filter((d) => stepsOf(d) >= goal).length : 0;
  const best = logged.reduce((top, d) => Math.max(top, stepsOf(d)), 0);

  return (
    <Screen
      onRefresh={() => Promise.all([syncSteps(), query.refetch()])}
      header={
        <AppHeader title={a.stepsChartTitle} subtitle={a.stepsChartSub} backLabel={t.back} onBack={() => router.back()} />
      }
    >
      <FadeIn>
        <ChoiceRow
          label={a.chartRange}
          options={RANGES.map((value) => ({ value, label: a.daysN.replace('{n}', value) }))}
          value={range}
          onChange={setRange}
        />
      </FadeIn>

      {query.error && !days.length ? (
        <>
          <Gap h={18} />
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void query.refetch()} />
        </>
      ) : null}

      {days.length ? (
        <>
          <Gap h={18} />
          <FadeIn delay={40}>
            <View style={styles.stats}>
              <Glass style={styles.statCard}>
                <MiniStat icon="chart-bar" value={formatSteps(average)} caption={a.averageDay} tint={c.primary} />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat icon="check-circle-outline" value={`${atGoal} / ${logged.length}`} caption={a.daysAtGoal} tint={c.successMark} />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat icon="trophy-outline" value={formatSteps(best)} caption={a.bestDay} tint={c.successMark} />
              </Glass>
            </View>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={80}>
            <Section title={a.daysN.replace('{n}', range).toUpperCase()}>
              <HabitTrendChart
                key={range}
                days={[...days].reverse()}
                goal={goal}
                value={(d) => d.steps}
                format={formatSteps}
                color={c.primary}
                goalText={a.chartGoal}
                averageText={a.chartAverage}
                emptyText={a.chartNoData}
              />
            </Section>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={120}>
            <HabitHistoryList
              title={a.daysN.replace('{n}', range).toUpperCase()}
              days={days}
              goal={goal}
              value={stepsOf}
              format={formatSteps}
            />
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
});
