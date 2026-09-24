// Daily habits UI: the dashboard's Today section (steps card, water and sleep tiles),
// the tracking prompts, the −/+ controls, and the hooks that read and change habit data.
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Linking, Platform, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { StepButton } from '@/components/panel';
import { QuietButton, LinkText } from '@/components/ui';
import { useNotice } from '@/components/notice';
import { StepsHero } from '@/components/steps-ring';
import { WaterGlass, SleepRing, WATER_COLOR, SLEEP_COLOR } from '@/components/habit-art';
import { usePressScale } from '@/components/motion';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { useSteps, useTodaySteps } from '@/lib/steps-provider';
import type { AuthUser } from '@/graphql/auth';
import {
  ADD_WATER,
  HABIT_DAY_FIELDS,
  HABIT_LIMITS,
  HABIT_SUMMARY,
  LOG_HABITS,
  type HabitDay,
  type HabitSummary,
} from '@/graphql/habits';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Short weekday and date for a YYYY-MM-DD string, e.g. "Mon 22". */
export const dayLabel = (day: string, lang: Lang): string => {
  try {
    return new Date(`${day}T12:00:00Z`).toLocaleDateString(lang === 'rn' ? 'fr' : lang, {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return day.slice(5);
  }
};

const fmt = (value: number): string => value.toLocaleString();

export const streakText = (days: number, a: AppCopy): string =>
  days > 0 ? a.streak.replace('{n}', String(days)) : a.noStreak;

/** Today's numbers and streaks. */
export function useHabitSummary() {
  return useQuery<{ habitSummary: HabitSummary }>(HABIT_SUMMARY);
}

// Current cached values for a day, so fast repeated taps build on each other.
function useCachedDay() {
  const client = useApolloClient();
  return useCallback(
    (day: string): HabitDay =>
      client.cache.readFragment<HabitDay>({
        id: client.cache.identify({ __typename: 'HabitDay', day }),
        fragment: HABIT_DAY_FIELDS,
      }) ?? { day, waterGlasses: 0, steps: 0, sleepHours: 0 },
    [client],
  );
}

/** Adds or removes glasses on a day. The UI updates immediately; streaks refresh after. */
export function useAddWater() {
  const notice = useNotice();
  const { lang } = useLang();
  const cachedDay = useCachedDay();
  const [mutate] = useMutation<{ addWater: HabitDay }>(ADD_WATER);

  return useCallback(
    (day: string, glasses: number) => {
      const base = cachedDay(day);
      const next = Math.min(HABIT_LIMITS.water, Math.max(0, base.waterGlasses + glasses));
      mutate({
        variables: { input: { day, glasses } },
        optimisticResponse: { addWater: { ...base, __typename: 'HabitDay', waterGlasses: next } },
        refetchQueries: ['HabitSummary'],
      }).catch((e: unknown) => {
        notice.failure(APP_COPY[lang].waterLabel, errorMessage(e, lang));
      });
    },
    [cachedDay, mutate, notice, lang],
  );
}

/** Adds or removes sleep (in hours) on a day, with the same immediate update. */
export function useAdjustSleep() {
  const notice = useNotice();
  const { lang } = useLang();
  const cachedDay = useCachedDay();
  const [mutate] = useMutation<{ logHabits: HabitDay }>(LOG_HABITS);

  return useCallback(
    (day: string, hours: number) => {
      const base = cachedDay(day);
      const next = Math.min(HABIT_LIMITS.sleep, Math.max(0, base.sleepHours + hours));
      mutate({
        variables: { input: { day, sleepHours: next } },
        optimisticResponse: { logHabits: { ...base, __typename: 'HabitDay', sleepHours: next } },
        refetchQueries: ['HabitSummary'],
      }).catch((e: unknown) => {
        notice.failure(APP_COPY[lang].sleepLabel, errorMessage(e, lang));
      });
    },
    [cachedDay, mutate, notice, lang],
  );
}

/** Minus and plus buttons for one day's water. */
export function WaterButtons({ day, glasses }: { day: string; glasses: number }) {
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const addWater = useAddWater();
  return (
    <View style={styles.buttons}>
      <StepButton sign="minus" label={a.removeGlass} disabled={glasses <= 0} onPress={() => addWater(day, -1)} />
      <StepButton
        sign="plus"
        label={a.addGlass}
        disabled={glasses >= HABIT_LIMITS.water}
        onPress={() => addWater(day, 1)}
      />
    </View>
  );
}

/** Minus and plus buttons for one day's sleep, in half hours. */
export function SleepButtons({ day, hours }: { day: string; hours: number }) {
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const adjustSleep = useAdjustSleep();
  return (
    <View style={styles.buttons}>
      <StepButton sign="minus" label={a.removeHalfHour} disabled={hours <= 0} onPress={() => adjustSleep(day, -0.5)} />
      <StepButton
        sign="plus"
        label={a.addHalfHour}
        disabled={hours >= HABIT_LIMITS.sleep}
        onPress={() => adjustSleep(day, 0.5)}
      />
    </View>
  );
}

/** Explains the step-counting state and offers to turn it on. Null when counting normally. */
export function StepsPrompt() {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const { mode, permission, enable } = useSteps();

  if (mode === 'none') return <Text style={[T.fine, { color: c.faint }]}>{a.noStepSensor}</Text>;
  if (permission === 'denied') {
    return (
      <View style={{ gap: 10 }}>
        <Text style={[T.fine, { color: c.muted }]}>{a.stepsDenied}</Text>
        <QuietButton label={a.openAppSettings} onPress={() => void Linking.openSettings()} />
      </View>
    );
  }
  if (permission !== 'granted') {
    return (
      <View style={{ gap: 10 }}>
        <Text style={[T.fine, { color: c.muted }]}>{a.enableStepsNote}</Text>
        <QuietButton label={a.enableSteps} onPress={() => void enable()} />
      </View>
    );
  }
  if (mode === 'live') return <Text style={[T.fine, { color: c.faint }]}>{a.liveOnlyNote}</Text>;
  return null;
}

/** Offers automatic sleep tracking, or says where the numbers come from once it is on. */
export function SleepPrompt() {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const notice = useNotice();
  const { sleepSupported, sleepEnabled, enableSleep } = useSteps();
  const ios = Platform.OS === 'ios';

  if (!sleepSupported) return null;
  if (sleepEnabled) {
    return <Text style={[T.fine, { color: c.faint }]}>{ios ? a.sleepAutoIos : a.sleepAutoAndroid}</Text>;
  }
  return (
    <View style={{ gap: 6 }}>
      <Text style={[T.fine, { color: c.muted }]}>{ios ? a.trackSleepNoteIos : a.trackSleepNoteAndroid}</Text>
      <LinkText
        label={a.trackSleep}
        onPress={() => {
          void enableSleep().then((started) => {
            if (!started) notice.failure(a.sleepLabel, a.sleepNotStarted);
          });
        }}
      />
    </View>
  );
}

// A full-width tappable dashboard card: header, then the animated art on the left and
// the value, streak and controls on the right.
function HabitTile({
  title,
  icon,
  tint,
  onPress,
  art,
  caption,
  streak,
  controls,
}: {
  title: string;
  icon: IconName;
  tint: string;
  onPress: () => void;
  art: React.ReactNode;
  caption: React.ReactNode;
  streak?: string;
  controls: React.ReactNode;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const press = usePressScale(0.97);

  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={a.openDetails}
      >
        <Glass style={{ padding: 16 }}>
          <View style={styles.tileHead}>
            <View style={[styles.tileIcon, { backgroundColor: c.track }]}>
              <MaterialCommunityIcons name={icon} size={16} color={tint} />
            </View>
            <Text style={[T.label, { color: c.faint, flex: 1 }]} numberOfLines={1}>
              {title}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={c.faint} />
          </View>
          <View style={styles.tileBody}>
            <View style={styles.tileArt}>{art}</View>
            <View style={{ flex: 1, gap: 8 }}>
              {caption}
              {streak ? (
                <Text style={[T.fine, { color: c.faint }]} numberOfLines={1}>
                  {streak}
                </Text>
              ) : null}
              {controls}
            </View>
          </View>
        </Glass>
      </Pressable>
    </Animated.View>
  );
}

/** Water today on the dashboard: a filling glass, the count and −/+. Opens the water page. */
export function WaterTile({ user, today, streak }: { user: AuthUser; today: HabitDay; streak?: number }) {
  const router = useRouter();
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const goal = user.waterGoalGlasses;
  const met = goal > 0 && today.waterGlasses >= goal;

  return (
    <HabitTile
      title={a.waterLabel}
      icon="cup-water"
      tint={WATER_COLOR}
      onPress={() => router.push('/(app)/water')}
      art={<WaterGlass fill={goal > 0 ? today.waterGlasses / goal : 0} width={70} height={94} />}
      caption={
        <Text style={{ fontFamily: font.displayBold, fontSize: 26, color: met ? c.success : c.text }}>
          {fmt(today.waterGlasses)}
          <Text style={[T.fine, { color: c.muted }]}> / {fmt(goal)} {a.glasses}</Text>
        </Text>
      }
      streak={streak != null ? streakText(streak, a) : undefined}
      controls={<WaterButtons day={today.day} glasses={today.waterGlasses} />}
    />
  );
}

/** Last night's sleep on the dashboard: the moon ring and −/+. Opens the sleep page. */
export function SleepTile({ user, today, streak }: { user: AuthUser; today: HabitDay; streak?: number }) {
  const router = useRouter();
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const goal = user.sleepGoalHours;
  const met = goal > 0 && today.sleepHours >= goal;

  return (
    <HabitTile
      title={a.sleepLabel}
      icon="power-sleep"
      tint={SLEEP_COLOR}
      onPress={() => router.push('/(app)/sleep')}
      art={<SleepRing hours={today.sleepHours} goal={goal} size={108} stroke={9} moonOnly />}
      caption={
        <View style={{ gap: 2 }}>
          <Text style={[T.fine, { color: c.muted }]}>{a.lastNight}</Text>
          <Text style={{ fontFamily: font.displayBold, fontSize: 26, color: met ? c.success : c.text }}>
            {fmt(today.sleepHours)} h
            <Text style={[T.fine, { color: c.muted }]}> / {fmt(goal)} {a.hours}</Text>
          </Text>
        </View>
      }
      streak={streak != null ? streakText(streak, a) : undefined}
      controls={<SleepButtons day={today.day} hours={today.sleepHours} />}
    />
  );
}

/** The dashboard's Today section: the steps card, then the water and sleep tiles. */
export function TodayCard({ user, summary }: { user: AuthUser; summary?: HabitSummary }) {
  const router = useRouter();
  const { today: localDay } = useSteps();
  const today = summary?.today ?? { day: localDay, waterGlasses: 0, steps: 0, sleepHours: 0 };
  const steps = useTodaySteps(summary?.today);

  return (
    <View style={{ gap: 12 }}>
      <StepsHero
        steps={steps}
        goal={user.stepGoal}
        streakDays={summary?.streaks.steps ?? 0}
        onPress={() => router.push('/(app)/steps')}
        footer={<StepsPrompt />}
      />
      <WaterTile user={user} today={today} streak={summary?.streaks.water} />
      <SleepTile user={user} today={today} streak={summary?.streaks.sleep} />
    </View>
  );
}

const styles = StyleSheet.create({
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  tileIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  tileArt: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: 10 },
});
