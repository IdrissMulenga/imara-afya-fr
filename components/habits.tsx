// Daily habits UI: the dashboard's Today section (steps card, water and sleep tiles),
// the tracking prompts, the −/+ controls, and the hooks that read and change habit data.
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Linking, Platform, Animated } from 'react-native';
import { Pressable } from '@/components/pressable';
import { useRouter } from 'expo-router';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { StepButton } from '@/components/panel';
import { QuietButton, LinkText } from '@/components/ui';
import { useNotice } from '@/components/notice';
import { WaterGlass, SleepRing, WATER_COLOR, SLEEP_COLOR } from '@/components/habit-art';
import { usePressScale } from '@/components/motion';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font, radius } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { addToQueuedWater, enqueue, flushQueue, isOfflineError, queuedWater } from '@/lib/offline-queue';
import { syncDays } from '@/lib/band';
import { useSteps } from '@/lib/steps-provider';
import { schedulesFrom, upcomingNight } from '@/lib/sleep-schedule';
import type { AuthUser } from '@/graphql/auth';
import {
  ADD_WATER,
  HABIT_DAY_FIELDS,
  HABIT_LIMITS,
  HABIT_SUMMARY,
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

/** The streak line under a habit, e.g. "3-day streak". */
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
      }) ?? { day, waterGlasses: 0, steps: null, sleepHours: null },
    [client],
  );
}

/** Adds or removes glasses on a day. The UI updates immediately; streaks refresh after. Offline,
 *  the day's total is kept on the phone and sent later; while one is waiting, later taps update it. */
export function useAddWater() {
  const notice = useNotice();
  const { lang } = useLang();
  const client = useApolloClient();
  const cachedDay = useCachedDay();
  const [mutate] = useMutation<{ addWater: HabitDay }>(ADD_WATER);

  return useCallback(
    (day: string, glasses: number) => {
      const base = cachedDay(day);
      const next = Math.min(HABIT_LIMITS.water, Math.max(0, base.waterGlasses + glasses));
      // Shows the new total, and keeps it to send while offline.
      const keepOffline = () => {
        client.cache.writeFragment<HabitDay>({
          id: client.cache.identify({ __typename: 'HabitDay', day }),
          fragment: HABIT_DAY_FIELDS,
          data: { ...base, __typename: 'HabitDay', waterGlasses: next },
        });
        return enqueue({ kind: 'water', day, waterGlasses: next });
      };

      // A total already waiting for this day would overwrite a "+1" sent now, so it is updated instead.
      if (queuedWater(day) != null) {
        void keepOffline().then(() => flushQueue());
        return;
      }

      mutate({
        variables: { input: { day, glasses } },
        optimisticResponse: { addWater: { ...base, __typename: 'HabitDay', waterGlasses: next } },
        refetchQueries: ['HabitSummary'],
      })
        // A total waiting from before the queue had loaded must include this glass.
        .then(() => addToQueuedWater(day, glasses))
        .catch((e: unknown) => {
          if (isOfflineError(e)) {
            void keepOffline();
            notice.toast(APP_COPY[lang].savedOfflineShort);
            return;
          }
          notice.failure(APP_COPY[lang].waterLabel, errorMessage(e, lang));
        });
    },
    [cachedDay, client, mutate, notice, lang],
  );
}

// Pending sleep saves by day: taps within this window are sent as one sync.
const SLEEP_SAVE_DELAY = 1000;
const sleepTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Adds or removes sleep (in hours) on a day. The UI updates at once; the total is saved after
 *  the taps stop, through syncBand. */
export function useAdjustSleep() {
  const notice = useNotice();
  const { lang } = useLang();
  const client = useApolloClient();
  const cachedDay = useCachedDay();

  return useCallback(
    (day: string, hours: number) => {
      const base = cachedDay(day);
      const next = Math.min(HABIT_LIMITS.sleep, Math.max(0, (base.sleepHours ?? 0) + hours));
      client.cache.writeFragment<HabitDay>({
        id: client.cache.identify({ __typename: 'HabitDay', day }),
        fragment: HABIT_DAY_FIELDS,
        data: { ...base, __typename: 'HabitDay', sleepHours: next },
      });

      clearTimeout(sleepTimers.get(day));
      sleepTimers.set(
        day,
        setTimeout(() => {
          sleepTimers.delete(day);
          const sleepHours = cachedDay(day).sleepHours ?? 0;
          syncDays([{ day, sleepHours }])
            .catch((e: unknown) => notice.failure(APP_COPY[lang].sleepLabel, errorMessage(e, lang)))
            .finally(() => {
              client.refetchQueries({ include: ['HabitSummary', 'HabitHistory'] }).catch(() => {});
            });
        }, SLEEP_SAVE_DELAY),
      );
    },
    [cachedDay, client, notice, lang],
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
        style={{ borderRadius: radius.card }}
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
  const slept = today.sleepHours ?? 0;
  const met = goal > 0 && slept >= goal;
  const schedules = schedulesFrom(user);
  const night = schedules ? upcomingNight(schedules) : null;

  return (
    <HabitTile
      title={a.sleepLabel}
      icon="power-sleep"
      tint={SLEEP_COLOR}
      onPress={() => router.push('/sleep')}
      art={<SleepRing hours={slept} goal={goal} size={108} stroke={9} moonOnly />}
      caption={
        <View style={{ gap: 2 }}>
          <Text style={[T.fine, { color: c.muted }]}>{a.lastNight}</Text>
          <Text style={{ fontFamily: font.displayBold, fontSize: 26, color: met ? c.success : c.text }}>
            {fmt(slept)} h
            <Text style={[T.fine, { color: c.muted }]}> / {fmt(goal)} {a.hours}</Text>
          </Text>
          {night ? (
            <View style={styles.tonight}>
              <MaterialCommunityIcons name="bed-clock" size={14} color={SLEEP_COLOR} />
              <Text style={[T.fine, { color: c.muted, flexShrink: 1 }]} numberOfLines={1}>
                {a.tonightSchedule.replace('{bed}', night.bedtime).replace('{wake}', night.wakeTime)}
              </Text>
            </View>
          ) : null}
        </View>
      }
      streak={streak != null ? streakText(streak, a) : undefined}
      controls={<SleepButtons day={today.day} hours={slept} />}
    />
  );
}

const styles = StyleSheet.create({
  tonight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  tileIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  tileArt: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: 10 },
});
