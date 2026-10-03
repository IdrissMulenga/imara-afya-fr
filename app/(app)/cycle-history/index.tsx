// Cycle chart: every logged cycle as a bar with its period days, the typical cycle and the usual
// range, the averages, and the cycle-by-cycle list. Opened from the cycle tab.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ErrorNote, QuietButton } from '@/components/ui';
import { Divider, Section } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { CYCLE_COLOR, rangeText, useCycleSummary } from '@/components/cycle';
import { CycleHistoryChart, cycleBars } from '@/components/cycle-history';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { localDay } from '@/lib/steps';

export default function CycleHistoryScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const a = APP_COPY[lang];
  const today = localDay();
  const female = user?.gender === 'female';
  const query = useCycleSummary(!female);

  if (!user) return <Screen />;
  if (!female) return <Redirect href="/dashboard" />;

  const s = query.data?.cycleSummary;
  const bars = s ? cycleBars(s, today) : [];
  const days = (n: number | null) => (n == null ? '–' : a.daysN.replace('{n}', String(n)));

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={
        <AppHeader title={a.cycleChartTitle} subtitle={a.cycleChartSub} backLabel={t.back} onBack={() => router.back()} />
      }
    >
      {query.error && !s ? (
        <>
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void query.refetch()} />
        </>
      ) : null}

      {s ? (
        <>
          <FadeIn>
            <View style={styles.stats}>
              <Glass style={styles.stat}>
                <MiniStat icon="sync" value={days(s.averageCycleLength)} caption={a.avgCycle} tint={CYCLE_COLOR} />
              </Glass>
              <Glass style={styles.stat}>
                <MiniStat icon="water" value={days(s.averagePeriodLength)} caption={a.avgPeriod} tint={CYCLE_COLOR} />
              </Glass>
              <Glass style={styles.stat}>
                <MiniStat icon="swap-vertical" value={days(s.cycleVariation)} caption={a.variationLabel} tint={CYCLE_COLOR} />
              </Glass>
            </View>
            {s.cyclesUsed === 0 ? (
              <Text style={[T.fine, { color: c.faint, marginTop: 8, textAlign: 'center' }]}>{a.usingTypical}</Text>
            ) : null}
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={40}>
            <Section title={a.reportCyclesLogged.toUpperCase()}>
              {bars.length ? (
                <CycleHistoryChart bars={bars} typical={s.averageCycleLength} />
              ) : (
                <Text style={[T.fine, { color: c.faint }]}>{a.cycleChartEmpty}</Text>
              )}
            </Section>
          </FadeIn>

          {bars.length ? (
            <>
              <Gap h={18} />
              <FadeIn delay={80}>
                <Section title={a.periodsHistory}>
                  {[...bars].reverse().map((b, i) => (
                    <React.Fragment key={b.start}>
                      {i > 0 ? <Divider /> : null}
                      <View style={styles.row}>
                        <View style={[styles.dot, { backgroundColor: CYCLE_COLOR }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[T.body, { color: c.text }]}>{rangeText(b.start, b.last, lang)}</Text>
                          <Text style={[T.fine, { color: c.faint }]}>
                            {b.inProgress
                              ? a.cycleInProgress.replace('{n}', String(b.cycleDays))
                              : a.cycleOfN.replace('{n}', String(b.cycleDays))}
                            {` · ${a.avgPeriod}: ${days(b.periodDays)}`}
                          </Text>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
                </Section>
              </FadeIn>
            </>
          ) : null}
        </>
      ) : null}

      <Gap h={18} />
      <View style={styles.note}>
        <MaterialCommunityIcons name="information-outline" size={16} color={c.faint} style={{ marginTop: 1 }} />
        <Text style={[T.fine, { color: c.faint, flex: 1 }]}>{a.cycleDisclaimer}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  note: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
});
