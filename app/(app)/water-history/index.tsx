// Water chart: every day over 14, 30 or 90 days as a scrollable bar chart, with the average
// day, days at goal, the most water, and the day-by-day list. Opened from the water page.
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
import { WATER_COLOR } from '@/components/habit-art';
import { HabitHistoryList } from '@/components/habit-history';
import { HabitTrendChart } from '@/components/habit-trend';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { HABIT_HISTORY, type HabitDay } from '@/graphql/habits';

type Range = '14' | '30' | '90';
const RANGES: Range[] = ['14', '30', '90'];

const glasses = (day: HabitDay) => day.waterGlasses;
const formatGlasses = (n: number) => (Math.round(n * 10) / 10).toLocaleString();

export default function WaterHistoryScreen() {
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
  const goal = user.waterGoalGlasses;
  const average = days.length ? days.reduce((sum, d) => sum + glasses(d), 0) / days.length : 0;
  const atGoal = goal > 0 ? days.filter((d) => glasses(d) >= goal).length : 0;
  const most = days.reduce((top, d) => Math.max(top, glasses(d)), 0);
  const withUnit = (n: number) => `${formatGlasses(n)} ${a.glasses}`;

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={
        <AppHeader title={a.waterChartTitle} subtitle={a.waterChartSub} backLabel={t.back} onBack={() => router.back()} />
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
                <MiniStat icon="chart-bar" value={formatGlasses(average)} caption={a.averageDay} tint={WATER_COLOR} />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat icon="check-circle-outline" value={`${atGoal} / ${days.length}`} caption={a.daysAtGoal} tint={c.successMark} />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat icon="trophy-outline" value={formatGlasses(most)} caption={a.mostWater} tint={c.successMark} />
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
                value={glasses}
                format={withUnit}
                color={WATER_COLOR}
                goalText={a.chartGoal}
                averageText={a.chartAverage}
                emptyText={withUnit(0)}
              />
            </Section>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={120}>
            <HabitHistoryList
              title={a.daysN.replace('{n}', range).toUpperCase()}
              days={days}
              goal={goal}
              value={glasses}
              format={formatGlasses}
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
