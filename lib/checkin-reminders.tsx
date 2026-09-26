// Check-in notifications: mood reminders at 9:00, 14:00 and 19:00 (skipped after a recent
// check-in) and a warm message a few hours after each check-in.
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { useQuery } from '@apollo/client/react';
import {
  Notifications,
  createToggle,
  ensurePermission,
  hasPermission,
  supported,
  useNotificationRoutes,
} from './notifications';
import { useSession } from './session';
import { warmMessage } from '@/components/checkin';
import { CHECK_IN_SUMMARY, type CheckIn, type CheckInSummary } from '@/graphql/checkin';
import { APP_COPY } from '@/theme/copy-app';
import { useLang, type Lang } from '@/theme/i18n';

/** Local hours at which a mood reminder is shown. */
export const MOOD_HOURS = [9, 14, 19] as const;

const CHANNEL = 'checkin';
const MOOD_PREFIX = 'mood-';
const WARM_ID = 'warm-message';
// A week ahead keeps every reminder under iOS's limit of 64 scheduled notifications;
// they are topped up each time the app opens.
const DAYS_AHEAD = 7;
const HOUR = 60 * 60 * 1000;
// A reminder is skipped when a check-in happened this long before it.
const SKIP_WINDOW = 3 * HOUR;
// The warm message comes this long after a check-in, only between these hours.
const WARM_DELAY = 3 * HOUR;
const WARM_FIRST_HOUR = 8;
const WARM_LAST_HOUR = 21;
// Only check-ins this recent get a warm message (not old ones seen at app start).
const WARM_FRESH = 10 * 60 * 1000;

const moodStore = createToggle('imara.moodReminders');
const warmStore = createToggle('imara.warmMessages');

async function ensureChannel(lang: Lang): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: APP_COPY[lang].checkInLabel,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function cancelWhere(match: (id: string) => boolean): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => match(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

/** Replaces the scheduled mood reminders, skipping times right after `lastAt`. */
async function scheduleMood(lang: Lang, lastAt: string | null): Promise<void> {
  const a = APP_COPY[lang];
  await ensureChannel(lang);
  await cancelWhere((id) => id.startsWith(MOOD_PREFIX));

  const now = Date.now();
  const last = lastAt ? new Date(lastAt).getTime() : 0;
  for (let d = 0; d < DAYS_AHEAD; d++) {
    for (const hour of MOOD_HOURS) {
      const when = new Date();
      when.setDate(when.getDate() + d);
      when.setHours(hour, 0, 0, 0);
      const time = when.getTime();
      if (time <= now || (last && time - last >= 0 && time - last < SKIP_WINDOW)) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${MOOD_PREFIX}${time}`,
        content: { title: a.moodReminderTitle, body: a.moodReminderBody, data: { kind: 'mood' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL },
      });
    }
  }
}

/** Schedules the warm message for a check-in, replacing any earlier one. */
async function scheduleWarm(lang: Lang, entry: CheckIn): Promise<void> {
  const a = APP_COPY[lang];
  const when = new Date(new Date(entry.at).getTime() + WARM_DELAY);
  if (when.getHours() >= WARM_LAST_HOUR) return;
  if (when.getHours() < WARM_FIRST_HOUR) when.setHours(WARM_FIRST_HOUR, 0, 0, 0);
  await ensureChannel(lang);
  await Notifications.cancelScheduledNotificationAsync(WARM_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: WARM_ID,
    content: { title: a.warmMessageTitle, body: warmMessage(entry.mood, entry.energy, a), data: { kind: 'warm' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL },
  });
}

async function cancelAll(): Promise<void> {
  if (!supported) return;
  await cancelWhere((id) => id.startsWith(MOOD_PREFIX) || id === WARM_ID);
}

// A mood reminder opens a new check-in; a warm message opens the check-in page.
const ROUTES = { mood: '/checkin-flow', warm: '/checkin' } as const;

/** Keeps check-in notifications scheduled and opens the check-in page when one is tapped. */
export function CheckInReminders() {
  const { lang } = useLang();
  const { user, ready } = useSession();
  const userId = user?.id;
  const moodOn = useSyncExternalStore(moodStore.subscribe, moodStore.get);
  const warmOn = useSyncExternalStore(warmStore.subscribe, warmStore.get);

  // Shares the cache with the dashboard, so a new check-in shows up here too.
  const { data } = useQuery<{ checkInSummary: CheckInSummary }>(CHECK_IN_SUMMARY, {
    skip: !supported || !user || !(moodOn || warmOn),
  });
  const latest = data?.checkInSummary.latest ?? null;

  useNotificationRoutes(ROUTES, ready && !!userId);

  // Mood reminders follow the latest check-in and the language.
  useEffect(() => {
    if (!supported || !ready || !userId) return;
    if (!moodOn) {
      void cancelWhere((id) => id.startsWith(MOOD_PREFIX));
      return;
    }
    void hasPermission().then((granted) => {
      if (granted) void scheduleMood(lang, latest?.at ?? null).catch(() => {});
    });
  }, [ready, userId, moodOn, lang, latest?.at]);

  // A warm message for each new check-in.
  const warmed = useRef<string | null>(null);
  useEffect(() => {
    if (!supported || !warmOn || !latest || warmed.current === latest.id) return;
    warmed.current = latest.id;
    if (Date.now() - new Date(latest.at).getTime() > WARM_FRESH) return;
    void hasPermission().then((granted) => {
      if (granted) void scheduleWarm(lang, latest).catch(() => {});
    });
  }, [warmOn, latest, lang]);

  // Nothing is left scheduled after signing out.
  useEffect(() => {
    if (ready && !userId) void cancelAll();
  }, [ready, userId]);

  return null;
}

/** Mood reminder and warm message settings for the settings page. */
export function useCheckInNotifications() {
  const turn = useCallback(
    async (store: typeof moodStore, on: boolean): Promise<'enabled' | 'denied' | 'disabled'> => {
      if (!on) {
        await store.set(false);
        return 'disabled';
      }
      if (!(await ensurePermission())) return 'denied';
      await store.set(true);
      return 'enabled';
    },
    [],
  );

  return {
    supported,
    mood: useSyncExternalStore(moodStore.subscribe, moodStore.get),
    warm: useSyncExternalStore(warmStore.subscribe, warmStore.get),
    setMood: (on: boolean) => turn(moodStore, on),
    setWarm: (on: boolean) => turn(warmStore, on),
  };
}
