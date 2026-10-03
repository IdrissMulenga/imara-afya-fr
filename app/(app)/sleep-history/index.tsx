// Sleep chart: every night over 14, 30 or 90 days as a scrollable bar chart, with the average
// night, nights at goal, the longest night, and the night-by-night list. Opened from the sleep tab.
import React, { useState } from 'react';
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
import { SLEEP_COLOR } from '@/components/habit-art';
import { HabitHistoryList } from '@/components/habit-history';
import { HabitTrendChart } from '@/components/habit-trend';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { HABIT_HISTORY, type HabitDay } from '@/graphql/habits';

type Range = '14' | '30' | '90';
const RANGES: Range[] = ['14', '30', '90'];
const hours = (day: HabitDay) => day.sleepHours ?? 0;
const formatHours = (n: number) => `${(Math.round(n * 4) / 4).toLocaleString()} h`;

export default function SleepHistoryScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const a = APP_COPY[lang];
  const [range, setRange] = useState<Range>('30');

  const query = useQuery<{ habitHistory: HabitDay[] }>(HABIT_HISTORY, {
    variables: { days: Number(range) },
  });

  if (!user) return <Screen />;

  const days = query.data?.habitHistory ?? [];
  const goal = user.sleepGoalHours;
  // Nights not yet synced are left out of the average, not counted as no sleep.
  const logged = days.filter((d) => d.sleepHours != null);
  const average = logged.length ? logged.reduce((sum, d) => sum + hours(d), 0) / logged.length : 0;
  const atGoal = goal > 0 ? logged.filter((d) => hours(d) >= goal).length : 0;
  const longest = logged.reduce((top, d) => Math.max(top, hours(d)), 0);

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={
        <AppHeader title={a.sleepChartTitle} subtitle={a.sleepChartSub} backLabel={t.back} onBack={() => router.back()} />
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
                <MiniStat icon="chart-bar" value={formatHours(average)} caption={a.averageNight} tint={SLEEP_COLOR} />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat icon="check-circle-outline" value={`${atGoal} / ${logged.length}`} caption={a.nightsAtGoal} tint={c.successMark} />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat icon="trophy-outline" value={formatHours(longest)} caption={a.longestNight} tint={c.successMark} />
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
                value={(d) => d.sleepHours}
                format={formatHours}
                color={SLEEP_COLOR}
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
              value={hours}
              format={formatHours}
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
