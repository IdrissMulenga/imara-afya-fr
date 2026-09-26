// Steps: today's ring, streak and averages, a 14-day chart and the last 30 days.
// Manual entry is offered only when the phone cannot count steps.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { Field, PrimaryButton, ErrorNote, QuietButton } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { StepsRing, MiniStat, stepsToKm } from '@/components/steps-ring';
import { StepsPrompt, useHabitSummary } from '@/components/habits';
import { HabitChart, HabitHistoryList, HabitStats } from '@/components/habit-history';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { useSteps, useTodaySteps } from '@/lib/steps-provider';
import { syncSteps } from '@/lib/steps';
import { errorMessage } from '@/lib/errors';
import { HABIT_HISTORY, HABIT_LIMITS, LOG_HABITS, type HabitDay } from '@/graphql/habits';

const HISTORY_DAYS = 30;
const CHART_DAYS = 14;

const stepsOf = (day: HabitDay) => day.steps;
const formatSteps = (n: number) => Math.round(n).toLocaleString();

// Steps typed with or without thousands separators; NaN when not a whole number.
const parseSteps = (raw: string): number => {
  const digits = raw.replace(/[\s,.'’]/g, '');
  if (!digits) return 0;
  return /^\d+$/.test(digits) ? Number(digits) : Number.NaN;
};

export default function StepsScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const { mode, permission } = useSteps();
  const a = APP_COPY[lang];

  const summaryQuery = useHabitSummary();
  const historyQuery = useQuery<{ habitHistory: HabitDay[] }>(HABIT_HISTORY, {
    variables: { days: HISTORY_DAYS },
  });

  const summary = summaryQuery.data?.habitSummary;
  const todaySteps = useTodaySteps(summary?.today);

  // History with today's value replaced by the live count.
  const history = useMemo(() => {
    const days = historyQuery.data?.habitHistory ?? [];
    return days.map((entry, i) => (i === 0 ? { ...entry, steps: Math.max(entry.steps, todaySteps) } : entry));
  }, [historyQuery.data, todaySteps]);

  if (!user) return <Screen />;

  const goal = user.stepGoal;
  const canType = mode === 'none' || permission === 'denied';

  return (
    <Screen
      onRefresh={() => Promise.all([summaryQuery.refetch(), historyQuery.refetch(), syncSteps()])}
      header={
        <AppHeader title={a.stepsTitle} subtitle={a.stepsSub} backLabel={t.back} onBack={() => router.back()} />
      }
    >
      <FadeIn>
        <Glass style={{ padding: 18 }}>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <StepsRing steps={todaySteps} goal={goal} size={230} stroke={18} />
            <View style={styles.statsRow}>
              <MiniStat
                icon="fire"
                value={String(summary?.streaks.steps ?? 0)}
                caption={a.streakLabel}
                tint={(summary?.streaks.steps ?? 0) > 0 ? '#E8772E' : c.faint}
              />
              <MiniStat icon="map-marker-distance" value={`${stepsToKm(todaySteps)} ${a.kmUnit}`} caption={a.distance} />
            </View>
            <StepsPrompt />
          </View>
        </Glass>
      </FadeIn>

      {canType ? (
        <>
          <Gap h={18} />
          <FadeIn delay={60}>
            <ManualSteps day={summary?.today.day} current={summary?.today.steps ?? 0} />
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
            <HabitStats days={history} value={stepsOf} format={formatSteps} bestCaption={a.bestDay} />
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={160}>
            <Section title={a.last14Days}>
              <HabitChart days={history.slice(0, CHART_DAYS).reverse()} goal={goal} value={stepsOf} color={c.primary} />
            </Section>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={210}>
            <HabitHistoryList title={a.stepsHistory} days={history} goal={goal} value={stepsOf} format={formatSteps} />
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}

// Typing today's steps, for phones that cannot count them.
function ManualSteps({ day, current }: { day?: string; current: number }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const notice = useNotice();
  const [text, setText] = useState(current ? String(current) : '');
  const [error, setError] = useState('');
  const [logHabits, { loading }] = useMutation<{ logHabits: HabitDay }>(LOG_HABITS);

  const steps = parseSteps(text);
  const invalid = Number.isNaN(steps) || steps > HABIT_LIMITS.steps;

  const save = async () => {
    if (invalid || !day) return;
    setError('');
    try {
      await logHabits({ variables: { input: { day, steps } }, refetchQueries: ['HabitSummary'] });
      notice.success(a.saved, a.stepsLabel);
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  return (
    <Section title={a.enterSteps}>
      <Field
        label={a.stepsLabel}
        value={text}
        onChangeText={setText}
        keyboardType="number-pad"
        placeholder="0"
        maxLength={9}
        errorText={invalid ? a.outOfRange : error || undefined}
      />
      <Text style={[T.fine, { color: c.faint }]}>{a.stepsHint}</Text>
      <PrimaryButton label={a.save} onPress={save} busy={loading} disabled={invalid || steps === current || !day} />
    </Section>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around' },
});
