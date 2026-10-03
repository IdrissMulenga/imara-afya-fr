// Insights: this week against last week, then patterns between the daily goals and mood or energy
// over the last 30 or 90 days, with a note that they are patterns, not causes. Opened from the dashboard.
import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ChoiceRow, ErrorNote, InfoNote, QuietButton } from '@/components/ui';
import { FadeIn } from '@/components/motion';
import { PatternCard, WeekCompare, useInsights } from '@/components/insights';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';

type Range = '30' | '90';
const RANGES: Range[] = ['30', '90'];

export default function InsightsScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const a = APP_COPY[lang];
  const [range, setRange] = useState<Range>('30');

  const query = useInsights(Number(range));
  // Keeps the last result on screen while a new range loads.
  const insights = (query.data ?? query.previousData)?.insights;

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={<AppHeader title={a.insightsPageTitle} subtitle={a.insightsSub} backLabel={t.back} onBack={() => router.back()} />}
    >
      {query.error && !insights ? (
        <>
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void query.refetch()} />
        </>
      ) : null}

      {insights ? (
        <>
          <FadeIn>
            <Text style={[T.label, { color: c.faint, marginLeft: 2, marginBottom: 10 }]}>{a.insightsWeekTitle}</Text>
            <WeekCompare thisWeek={insights.thisWeek} lastWeek={insights.lastWeek} />
          </FadeIn>

          <Gap h={26} />
          <FadeIn delay={60}>
            <Text style={[T.label, { color: c.faint, marginLeft: 2, marginBottom: 10 }]}>{a.insightsPatternsTitle}</Text>
            <ChoiceRow
              label={a.chartRange}
              options={RANGES.map((value) => ({ value, label: a.daysN.replace('{n}', value) }))}
              value={range}
              onChange={setRange}
            />
          </FadeIn>

          <Gap h={14} />
          <FadeIn delay={100}>
            {insights.patterns.length ? (
              <>
                {insights.patterns.map((pattern) => (
                  <React.Fragment key={`${pattern.factor}-${pattern.outcome}`}>
                    <PatternCard pattern={pattern} />
                    <Gap h={12} />
                  </React.Fragment>
                ))}
              </>
            ) : (
              <>
                <InfoNote>{a.insightsNoPatterns}</InfoNote>
                <Gap h={12} />
              </>
            )}
            <Text style={[T.fine, { color: c.faint, marginHorizontal: 2 }]}>{a.insightsNote}</Text>
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}
