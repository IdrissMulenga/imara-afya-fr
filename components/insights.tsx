// Insights UI: the hook that reads them, a pattern card with its sentence and two bars, the
// this-week-vs-last-week rows, and the dashboard card that opens the insights page.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { Divider, NavRow } from '@/components/panel';
import { WATER_COLOR, SLEEP_COLOR } from '@/components/habit-art';
import { scoreTone } from '@/components/mood-art';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font, radius } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import {
  INSIGHTS,
  INSIGHT_LIMITS,
  type InsightFactor,
  type InsightPattern,
  type InsightPeriod,
  type Insights,
  type SleepRegularity,
  type SleepSummary,
} from '@/graphql/insights';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const FACTOR_ICON: Record<InsightFactor, IconName> = {
  SLEEP: 'power-sleep',
  STEPS: 'walk',
  WATER: 'cup-water',
  REGULAR_SLEEP: 'bed-clock',
};

/** The tint for a factor: water and sleep match their tiles, steps the app's primary. */
const useFactorTint = (): Record<InsightFactor, string> => {
  const { c } = useTheme();
  return { SLEEP: SLEEP_COLOR, STEPS: c.primary, WATER: WATER_COLOR, REGULAR_SLEEP: SLEEP_COLOR };
};

/** "4.3" in the app's number format. */
const score = (value: number): string => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

/** Insights over the last `days` days (patterns) plus this week and last week. */
export function useInsights(days: number = INSIGHT_LIMITS.defaultDays) {
  return useQuery<{ insights: Insights }>(INSIGHTS, { variables: { days } });
}

/** "On days you met your sleep goal, your mood averaged 4.3 / 5, compared with 2.3 / 5 on other days."
 *  Regular sleep has its own sentence: it compares regular nights with irregular ones, not a goal. */
export const patternText = (pattern: InsightPattern, a: AppCopy): string => {
  const outcome = pattern.outcome === 'MOOD' ? a.insightsOutcomeMood : a.insightsOutcomeEnergy;
  const template =
    pattern.factor === 'REGULAR_SLEEP'
      ? a.insightsRegularPattern
      : a.insightsPattern.replace(
          '{goal}',
          { SLEEP: a.insightsGoalSleep, STEPS: a.insightsGoalSteps, WATER: a.insightsGoalWater }[pattern.factor]
        );
  return template
    .replace('{outcome}', outcome)
    .replace('{met}', score(pattern.goalMetAverage))
    .replace('{missed}', score(pattern.goalMissedAverage));
};

// One labelled bar on the 1–5 scale.
function ScoreBar({ label, value, days }: { label: string; value: number; days: string }) {
  const { c } = useTheme();
  const tone = scoreTone(Math.round(value));
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.barHead}>
        <Text style={[T.fine, { color: c.muted, flex: 1 }]} numberOfLines={1}>
          {label} · {days}
        </Text>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: c.text }}>{score(value)} / 5</Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.track }]}>
        <View style={[styles.fill, { width: `${(Math.min(5, Math.max(0, value)) / 5) * 100}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

/** One pattern: the factor's icon, the sentence, and goal-met vs below-goal bars. */
export function PatternCard({ pattern }: { pattern: InsightPattern }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const tint = useFactorTint()[pattern.factor];
  const days = (n: number) => a.daysN.replace('{n}', String(n));
  const regular = pattern.factor === 'REGULAR_SLEEP';

  return (
    <Glass style={{ padding: 16, gap: 14 }}>
      <View style={styles.patternHead}>
        <View style={[styles.icon, { backgroundColor: `${tint}22` }]}>
          <MaterialCommunityIcons name={FACTOR_ICON[pattern.factor]} size={18} color={tint} />
        </View>
        <Text style={[T.body, { color: c.text, flex: 1 }]}>{patternText(pattern, a)}</Text>
      </View>
      <View style={{ gap: 10 }}>
        <ScoreBar label={regular ? a.insightsRegularNights : a.insightsGoalMet} value={pattern.goalMetAverage} days={days(pattern.goalMetDays)} />
        <ScoreBar
          label={regular ? a.insightsIrregularNights : a.insightsGoalMissed}
          value={pattern.goalMissedAverage}
          days={days(pattern.goalMissedDays)}
        />
      </View>
    </Glass>
  );
}

type Metric = {
  key: string;
  icon: IconName;
  tint: string;
  label: string;
  now: number | null;
  before: number | null;
  format: (value: number) => string;
  /** Days at goal this week; omitted for mood and energy. */
  goalDays?: number;
};

// An up, down or level arrow from last week to this week. Neutral colour: higher is not always better.
function Change({ now, before }: { now: number | null; before: number | null }) {
  const { c } = useTheme();
  if (now == null || before == null) return <View style={{ width: 18 }} />;
  const name: IconName = now > before ? 'arrow-top-right' : now < before ? 'arrow-bottom-right' : 'arrow-right';
  return <MaterialCommunityIcons name={name} size={18} color={c.faint} />;
}

/** This week's averages beside last week's, with days at goal. */
export function WeekCompare({ thisWeek, lastWeek }: { thisWeek: InsightPeriod; lastWeek: InsightPeriod }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const tint = useFactorTint();
  const dash = '–';
  const num = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const goalText = (n: number) => a.insightsGoalDays.replace('{n}', String(n));

  const metrics: Metric[] = [
    { key: 'water', icon: 'cup-water', tint: tint.WATER, label: a.waterLabel, now: thisWeek.waterGlasses, before: lastWeek.waterGlasses, format: (v) => `${num(v)} ${a.glasses}`, goalDays: thisWeek.waterGoalDays },
    { key: 'steps', icon: 'walk', tint: tint.STEPS, label: a.stepsLabel, now: thisWeek.steps, before: lastWeek.steps, format: (v) => `${Math.round(v).toLocaleString()} ${a.steps}`, goalDays: thisWeek.stepGoalDays },
    { key: 'sleep', icon: 'power-sleep', tint: tint.SLEEP, label: a.sleepLabel, now: thisWeek.sleepHours, before: lastWeek.sleepHours, format: (v) => `${num(v)} h`, goalDays: thisWeek.sleepGoalDays },
    { key: 'mood', icon: 'emoticon-outline', tint: c.primary, label: a.moodName, now: thisWeek.mood, before: lastWeek.mood, format: (v) => `${num(v)} / 5` },
    { key: 'energy', icon: 'lightning-bolt-outline', tint: c.primary, label: a.energyName, now: thisWeek.energy, before: lastWeek.energy, format: (v) => `${num(v)} / 5` },
  ];

  return (
    <Glass style={{ padding: 16 }}>
      <View style={styles.compareHead}>
        <Text style={[T.fine, { color: c.faint, flex: 1 }]} />
        <Text style={[T.fine, styles.col, { color: c.faint }]}>{a.insightsThisWeek}</Text>
        <View style={{ width: 18 }} />
        <Text style={[T.fine, styles.col, { color: c.faint }]}>{a.insightsLastWeek}</Text>
      </View>
      {metrics.map((m) => (
        <React.Fragment key={m.key}>
          <Divider />
          <View style={styles.compareRow}>
            <View style={styles.compareLabel}>
              <MaterialCommunityIcons name={m.icon} size={18} color={m.tint} />
              <View style={{ flex: 1 }}>
                <Text style={[T.body, { color: c.text }]} numberOfLines={1}>
                  {m.label}
                </Text>
                {m.goalDays != null && m.now != null ? (
                  <Text style={[T.fine, { color: c.faint }]}>{goalText(m.goalDays)}</Text>
                ) : null}
              </View>
            </View>
            <Text style={[T.body, styles.col, { color: c.text, fontFamily: font.bodySemi }]} numberOfLines={1}>
              {m.now == null ? dash : m.format(m.now)}
            </Text>
            <Change now={m.now} before={m.before} />
            <Text style={[T.body, styles.col, { color: c.muted }]} numberOfLines={1}>
              {m.before == null ? dash : m.format(m.before)}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </Glass>
  );
}

const hoursText = (value: number): string => `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} h`;

// The words and colour for each regularity.
const useRegularity = (regularity: SleepRegularity): { text: string; color: string } => {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  return {
    STEADY: { text: a.sleepSteady, color: c.success },
    VARIES: { text: a.sleepVaries, color: c.text },
    IRREGULAR: { text: a.sleepIrregular, color: c.text },
    UNKNOWN: { text: a.sleepUnknown, color: c.faint },
  }[regularity];
};

/** Recent sleep: the usual night, how regular it is, and this week's hours short of the goal. */
export function SleepCard({ sleep }: { sleep: SleepSummary }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const regularity = useRegularity(sleep.regularity);

  if (sleep.nights === 0) {
    return (
      <Glass style={{ padding: 16 }}>
        <Text style={[T.fine, { color: c.muted }]}>{a.sleepNoNights}</Text>
      </Glass>
    );
  }

  const cell = (label: string, value: string, color: string = c.text) => (
    <View style={styles.sleepCell}>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 16, color }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );

  return (
    <Glass style={{ padding: 16, gap: 12 }}>
      <View style={styles.sleepRow}>
        {cell(a.sleepUsual, sleep.usualHours != null ? hoursText(sleep.usualHours) : '–')}
        {cell(a.sleepRegularity, regularity.text, regularity.color)}
        {cell(
          a.sleepDebt,
          sleep.weekNights === 0 ? '–' : sleep.debtHours > 0 ? hoursText(sleep.debtHours) : a.sleepNoDebt
        )}
      </View>
      <Text style={[T.fine, { color: c.faint }]}>{a.sleepRegularityNote}</Text>
    </Glass>
  );
}

/** The dashboard's link to the insights page, previewing the strongest pattern. */
export function InsightsCard({ insights }: { insights?: Insights }) {
  const router = useRouter();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const top = insights?.patterns[0];

  return (
    <Glass style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
      <NavRow
        label={a.insightsCardTitle}
        hint={top ? patternText(top, a) : a.insightsCardEmpty}
        onPress={() => router.push('/(app)/insights')}
      />
    </Glass>
  );
}

const styles = StyleSheet.create({
  patternHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  barHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { height: 8, borderRadius: radius.chip, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.chip },
  compareHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  compareLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  col: { width: 92, textAlign: 'right' },
  sleepRow: { flexDirection: 'row', gap: 8 },
  sleepCell: { flex: 1, alignItems: 'center', gap: 2 },
});
