// Bedtime reminders 30 minutes before bedtime and at wake-up, using each night's schedule.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import {
  Notifications,
  createToggle,
  ensurePermission,
  hasPermission,
  supported,
  useNotificationRoutes,
} from './notifications';
import { useSession } from './session';
import { clockMinutes, schedulesFrom, type SleepSchedules } from './sleep-schedule';
import { APP_COPY } from '@/theme/copy-app';
import { useLang, type Lang } from '@/theme/i18n';

const CHANNEL = 'sleep';
const PREFIX = 'sleep-';
const WIND_DOWN_MINUTES = 30;

const store = createToggle('imara.bedtimeReminders');
const ROUTES = { sleep: '/sleep' } as const;

async function cancel(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

// One weekly reminder. `weekday` is 0 (Sunday) to 6; `minutes` is after midnight.
const weekly = (weekday: number, minutes: number) => ({
  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
  weekday: weekday + 1,
  hour: Math.floor(minutes / 60),
  minute: minutes % 60,
  channelId: CHANNEL,
});

async function schedule(lang: Lang, schedules: SleepSchedules): Promise<void> {
  const a = APP_COPY[lang];
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: a.bedtimeReminders,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancel();

  // For each wake-up day: the good-morning note that day, and the wind-down reminder
  // 30 minutes before that night's bedtime (usually the evening before).
  for (let day = 0; day < 7; day++) {
    const night = (day === 0 || day === 6) && schedules.weekend ? schedules.weekend : schedules.weekday;
    const wake = clockMinutes(night.wakeTime);
    const bed = clockMinutes(night.bedtime);
    const windDown = (bed > wake ? bed - 1440 : bed) - WIND_DOWN_MINUTES;
    const offset = Math.floor(windDown / 1440);

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}wind-down-${day}`,
      content: { title: a.windDownTitle, body: a.windDownBody, data: { kind: 'sleep' } },
      trigger: weekly((day + offset + 7) % 7, windDown - offset * 1440),
    });
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}morning-${day}`,
      content: { title: a.goodMorningTitle, body: a.goodMorningBody, data: { kind: 'sleep' } },
      trigger: weekly(day, wake),
    });
  }
}

/** Keeps bedtime reminders in line with the schedule, and opens the sleep page on a tap. */
export function SleepReminders() {
  const { lang } = useLang();
  const { user, ready } = useSession();
  const on = useSyncExternalStore(store.subscribe, store.get);
  const scheduleKey = JSON.stringify(user ? schedulesFrom(user) : null);

  useNotificationRoutes(ROUTES, ready && !!user);

  useEffect(() => {
    if (!supported || !ready) return;
    const schedules = JSON.parse(scheduleKey) as SleepSchedules | null;
    if (!on || !schedules) {
      void cancel();
      return;
    }
    void hasPermission().then((granted) => {
      if (granted) void schedule(lang, schedules).catch(() => {});
    });
  }, [ready, on, scheduleKey, lang]);

  return null;
}

/** The bedtime reminders switch. */
export function useBedtimeReminders() {
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
