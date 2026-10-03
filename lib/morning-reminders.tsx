// A good-morning note every morning at the wake-up time from the sleep schedule (07:00 without
// one), skipped on a morning the app was already opened before it.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  Notifications,
  cancelScheduled,
  createToggle,
  ensurePermission,
  hasPermission,
  supported,
  useNotificationRoutes,
} from './notifications';
import { useSession } from './session';
import { isWeekend, schedulesFrom, type SleepSchedules } from './sleep-schedule';
import { DEFAULT_WAKE, dayOf, planMorning, upBeforeWake } from './reminder-plan';
import { APP_COPY } from '@/theme/copy-app';
import { useLang, type Lang } from '@/theme/i18n';

const CHANNEL = 'morning';
const PREFIX = 'morning-';
// The morning the app was opened before the note, so it is not sent that day.
const SKIP_KEY = 'imara.morningSkip';
// Set once the switch has been turned on for people who had the note with bedtime reminders.
const MIGRATED_KEY = 'imara.morningMigrated';
const BEDTIME_KEY = 'imara.bedtimeReminders';
// Today and the next two days; topped up each time the app opens.
const DAYS_AHEAD = 3;

const store = createToggle('imara.morningReminders');
const ROUTES = { morning: '/dashboard' } as const;

/** The wake-up time for the morning of `day`. */
const wakeFor = (schedules: SleepSchedules | null) => (day: string): string => {
  if (!schedules) return DEFAULT_WAKE;
  return (isWeekend(day) && schedules.weekend ? schedules.weekend : schedules.weekday).wakeTime;
};

const cancel = (): Promise<void> => cancelScheduled((id) => id.startsWith(PREFIX));

async function schedule(lang: Lang, schedules: SleepSchedules | null): Promise<void> {
  const a = APP_COPY[lang];
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: a.morningReminders,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancel();
  const skipDay = await SecureStore.getItemAsync(SKIP_KEY).catch(() => null);
  for (const slot of planMorning(new Date(), wakeFor(schedules), skipDay, DAYS_AHEAD)) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${slot.day}`,
      content: { title: a.goodMorningTitle, body: a.goodMorningBody, data: { kind: 'morning' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: slot.date, channelId: CHANNEL },
    });
  }
}

/** Drops today's note when the app is opened before the wake-up time. */
async function skipIfUp(schedules: SleepSchedules | null): Promise<void> {
  const now = new Date();
  const today = dayOf(now);
  if (!upBeforeWake(now, wakeFor(schedules)(today))) return;
  await SecureStore.setItemAsync(SKIP_KEY, today).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(`${PREFIX}${today}`).catch(() => {});
}

/** Turns the switch on once for people who had the good-morning note with bedtime reminders. */
async function migrate(): Promise<void> {
  if (await SecureStore.getItemAsync(MIGRATED_KEY).catch(() => '1')) return;
  if ((await SecureStore.getItemAsync(BEDTIME_KEY).catch(() => null)) === '1') await store.set(true);
  await SecureStore.setItemAsync(MIGRATED_KEY, '1').catch(() => {});
}

/** Keeps the good-morning note scheduled, skips it on mornings the app is already open, and
 *  opens the dashboard on a tap. */
export function MorningReminders() {
  const { lang } = useLang();
  const { user, ready } = useSession();
  const userId = user?.id;
  const on = useSyncExternalStore(store.subscribe, store.get);
  const scheduleKey = JSON.stringify(user ? schedulesFrom(user) : null);

  useNotificationRoutes(ROUTES, ready && !!userId);

  useEffect(() => {
    if (supported) void migrate();
  }, []);

  useEffect(() => {
    if (!supported || !ready) return;
    const schedules = JSON.parse(scheduleKey) as SleepSchedules | null;
    if (!userId || !on) {
      void cancel();
      return;
    }
    // The skip is recorded before scheduling, so today's note is not put back.
    void skipIfUp(schedules)
      .then(() => hasPermission())
      .then((granted) => (granted ? schedule(lang, schedules) : undefined))
      .catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void skipIfUp(schedules);
    });
    return () => sub.remove();
  }, [ready, userId, on, lang, scheduleKey]);

  return null;
}

/** The good-morning switch. */
export function useMorningReminders() {
  const enabled = useSyncExternalStore(store.subscribe, store.get);
  const set = useCallback(async (next: boolean): Promise<'enabled' | 'denied' | 'disabled'> => {
    if (!next) {
      await store.set(false);
      return 'disabled';
    }
    if (!(await ensurePermission())) return 'denied';
    await store.set(true);
    return 'enabled';
  }, []);
  return { supported, enabled, set };
}
