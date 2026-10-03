// BMI chart: BMI over 30, 90 or 365 days from the logged weights and the current height, with
// the usual ranges shaded, the current BMI and its range, the change, and BMI by day. BMI comes
// from the server (weightHistory). Opened from the profile page.
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ChoiceRow, ErrorNote, QuietButton } from '@/components/ui';
import { Badge, Divider, Section } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { addDays, dateText } from '@/components/cycle';
import { TrendLineChart, type TrendBand } from '@/components/trend-line';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, bmiBand } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { localDay } from '@/lib/steps';
import { WEIGHT_HISTORY, type WeightEntry } from '@/graphql/weight';

type Range = '30' | '90' | '365';
const RANGES: Range[] = ['30', '90', '365'];
const AMBER = '#D9892B';

const bmiText = (bmi: number): string => (Math.round(bmi * 10) / 10).toLocaleString();
const bmiChange = (diff: number): string => {
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toLocaleString()}`;
};

export default function BmiHistoryScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const a = APP_COPY[lang];
  const today = localDay();
  const [range, setRange] = useState<Range>('90');
  const count = Number(range);

  const query = useQuery<{ weightHistory: WeightEntry[] }>(WEIGHT_HISTORY, { variables: { days: count } });
  // Oldest first, only entries with a BMI (none without a height).
  const points = useMemo(
    () =>
      [...(query.data?.weightHistory ?? [])]
        .reverse()
        .filter((e): e is WeightEntry & { bmi: number } => e.bmi != null)
        .map((e) => ({ day: e.day, value: e.bmi })),
    [query.data],
  );

  if (!user) return <Screen />;

  const bands: TrendBand[] = [
    { low: 0, high: 18.5, color: AMBER },
    { low: 18.5, high: 25, color: c.successMark },
    { low: 25, high: 30, color: AMBER },
    { low: 30, high: 100, color: c.danger },
  ];
  const toneColor = (tone: 'low' | 'ok' | 'high', bmi: number) =>
    tone === 'ok' ? c.success : bmi >= 30 ? c.danger : AMBER;
  const note = (bmi: number) => {
    const band = bmiBand(bmi, a);
    return band ? { text: band.text, color: toneColor(band.tone, bmi) } : null;
  };

  const from = addDays(today, -(count - 1));
  const latest = points[points.length - 1];
  const first = points[0];
  const current = bmiBand(user.bmi, a);
  const noHeight = user.heightCm == null;

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={<AppHeader title={a.bmiChartTitle} subtitle={a.bmiChartSub} backLabel={t.back} onBack={() => router.back()} />}
    >
      {noHeight ? (
        <FadeIn>
          <Glass style={{ padding: 16, gap: 12 }}>
            <Text style={[T.body, { color: c.text }]}>{a.bmiUnknown}</Text>
            <QuietButton label={a.bmiAddHeight} onPress={() => router.push('/(app)/profile')} />
          </Glass>
        </FadeIn>
      ) : (
        <>
          <FadeIn>
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
                  <Glass style={styles.statCard}>
                    <MiniStat icon="human" value={user.bmi != null ? bmiText(user.bmi) : '–'} caption={a.weightCurrent} tint={c.primary} />
                  </Glass>
                  <Glass style={styles.statCard}>
                    <MiniStat
                      icon="swap-vertical"
                      value={latest && first && latest !== first ? bmiChange(latest.value - first.value) : '–'}
                      caption={a.weightChange}
                      tint={c.primary}
                    />
                  </Glass>
                  <Glass style={styles.statCard}>
                    <MiniStat icon="format-list-numbered" value={String(points.length)} caption={a.weightEntries} tint={c.primary} />
                  </Glass>
                </View>
                {current ? (
                  <View style={styles.badgeRow}>
                    <Badge text={current.text} tone={current.tone === 'ok' ? 'good' : 'neutral'} />
                    <Text style={[T.fine, { color: c.faint }]}>
                      {a.bmiHeightUsed.replace('{cm}', String(user.heightCm))}
                    </Text>
                  </View>
                ) : null}
              </FadeIn>

              <Gap h={18} />
              <FadeIn delay={80}>
                <Section title={a.daysN.replace('{n}', range).toUpperCase()}>
                  {points.length ? (
                    <TrendLineChart
                      key={range}
                      points={points}
                      from={from}
                      to={today}
                      color={c.primary}
                      format={bmiText}
                      change={bmiChange}
                      note={note}
                      bands={bands}
                      minSpan={3}
                    />
                  ) : (
                    <Text style={[T.fine, { color: c.faint }]}>{a.weightEmpty}</Text>
                  )}
                  <QuietButton label={a.bmiLogWeight} onPress={() => router.push('/weight-history')} />
                </Section>
              </FadeIn>

              {points.length ? (
                <>
                  <Gap h={18} />
                  <FadeIn delay={120}>
                    <Section title={a.bmiHistoryTitle}>
                      {[...points].reverse().map((p, i) => {
                        const n = note(p.value);
                        return (
                          <React.Fragment key={p.day}>
                            {i > 0 ? <Divider /> : null}
                            <View style={styles.row}>
                              <View style={{ flex: 1 }}>
                                <Text style={[T.body, { color: c.text }]}>
                                  {p.day === today ? a.dayToday : dateText(p.day, lang, true)}
                                </Text>
                                {n ? <Text style={[T.fine, { color: n.color }]}>{n.text}</Text> : null}
                              </View>
                              <Text style={[T.body, { color: c.text }]}>{bmiText(p.value)}</Text>
                            </View>
                          </React.Fragment>
                        );
                      })}
                    </Section>
                  </FadeIn>
                </>
              ) : null}
            </>
          ) : null}
        </>
      )}

      <Gap h={18} />
      <View style={styles.note}>
        <MaterialCommunityIcons name="information-outline" size={16} color={c.faint} style={{ marginTop: 1 }} />
        <Text style={[T.fine, { color: c.faint, flex: 1 }]}>{a.bmiNote}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  note: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
});
