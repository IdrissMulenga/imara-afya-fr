// Mood and energy chart: both scores each day over 14, 30 or 90 days as a scrollable line chart,
// focused on mood or energy (?focus=energy), with the averages, days checked in, and the
// day-by-day list. Opened from the check-in tab.
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ChoiceRow, ErrorNote, QuietButton } from '@/components/ui';
import { Divider, Section } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { dayLabel } from '@/components/habits';
import { ScoreArt, formatAverage } from '@/components/checkin';
import { scoreTone } from '@/components/mood-art';
import { MoodHistoryChart, type MoodFocus } from '@/components/mood-history';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { localDay } from '@/lib/steps';
import { CHECK_IN_HISTORY, type CheckInDay } from '@/graphql/checkin';

type Range = '14' | '30' | '90';
const RANGES: Range[] = ['14', '30', '90'];

const addDays = (day: string, n: number): string => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const meanOf = (values: number[]): number | null =>
  values.length ? Math.round((values.reduce((t, v) => t + v, 0) / values.length) * 10) / 10 : null;

export default function CheckInHistoryScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const a = APP_COPY[lang];
  const today = localDay();
  const params = useLocalSearchParams<{ focus?: string }>();
  const [focus, setFocus] = useState<MoodFocus>(params.focus === 'energy' ? 'energy' : 'mood');
  const [range, setRange] = useState<Range>('30');
  const count = Number(range);

  const query = useQuery<{ checkInHistory: CheckInDay[] }>(CHECK_IN_HISTORY, { variables: { days: count } });
  const days = useMemo(() => query.data?.checkInHistory ?? [], [query.data]);
  const byDay = useMemo(() => new Map(days.map((d) => [d.day, d])), [days]);
  const dates = useMemo(
    () => Array.from({ length: count }, (_, i) => addDays(today, -(count - 1 - i))),
    [count, today],
  );

  const mood = meanOf(days.map((d) => d.mood));
  const energy = meanOf(days.map((d) => d.energy));

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={
        <AppHeader
          title={focus === 'energy' ? a.energyChartTitle : a.moodChartTitle}
          subtitle={a.moodChartSub}
          backLabel={t.back}
          onBack={() => router.back()}
        />
      }
    >
      <FadeIn>
        <ChoiceRow
          label={a.chartFocus}
          options={[
            { value: 'mood', label: a.moodName },
            { value: 'energy', label: a.energyName },
          ]}
          value={focus}
          onChange={setFocus}
        />
        <Gap h={14} />
        <ChoiceRow
          label={a.chartRange}
          options={RANGES.map((value) => ({ value, label: a.daysN.replace('{n}', value) }))}
          value={range}
          onChange={setRange}
        />
      </FadeIn>

      {query.error && !query.data ? (
        <>
          <Gap h={18} />
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void query.refetch()} />
        </>
      ) : null}

      {query.data ? (
        <>
          <Gap h={18} />
          <FadeIn delay={40}>
            <View style={styles.stats}>
              {focus === 'energy' ? (
                <>
                  <AverageCard kind="energy" value={energy} caption={a.energyName} />
                  <AverageCard kind="mood" value={mood} caption={a.moodName} />
                </>
              ) : (
                <>
                  <AverageCard kind="mood" value={mood} caption={a.moodName} />
                  <AverageCard kind="energy" value={energy} caption={a.energyName} />
                </>
              )}
              <Glass style={styles.statCard}>
                <MiniStat icon="calendar-check" value={`${days.length} / ${count}`} caption={a.daysCheckedIn} tint={c.primary} />
              </Glass>
            </View>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={80}>
            <Section title={a.daysN.replace('{n}', range).toUpperCase()}>
              <MoodHistoryChart key={range} dates={dates} byDay={byDay} today={today} focus={focus} />
            </Section>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={120}>
            <Section title={a.checkInHistory}>
              {days.length ? (
                days.map((day, i) => (
                  <React.Fragment key={day.day}>
                    {i > 0 ? <Divider /> : null}
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={[T.body, { color: c.text }]}>
                          {day.day === today ? a.dayToday : dayLabel(day.day, lang)}
                        </Text>
                        <Text style={[T.fine, { color: c.faint }]}>
                          {day.entries.length > 1 ? `${day.entries.length} × · ` : ''}
                          {a.moodWords[Math.round(day.mood) - 1]} · {a.energyWords[Math.round(day.energy) - 1]}
                        </Text>
                      </View>
                      <View style={styles.art}>
                        <ScoreArt kind="mood" score={day.mood} size={26} />
                        <ScoreArt kind="energy" score={day.energy} size={26} />
                      </View>
                    </View>
                  </React.Fragment>
                ))
              ) : (
                <Text style={[T.fine, { color: c.faint }]}>{a.noCheckIns}</Text>
              )}
            </Section>
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}

// An average with its face or battery, coloured by the score.
function AverageCard({ kind, value, caption }: { kind: 'mood' | 'energy'; value: number | null; caption: string }) {
  const { c } = useTheme();
  return (
    <Glass style={styles.statCard}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        {value == null ? <View style={{ height: 26 }} /> : <ScoreArt kind={kind} score={value} size={26} />}
        <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: value == null ? c.faint : scoreTone(value) }}>
          {formatAverage(value)}
        </Text>
        <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]} numberOfLines={1}>
          {caption}
        </Text>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  art: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
