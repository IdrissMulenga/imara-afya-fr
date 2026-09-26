// Cycle reminders two days before each expected period and when each fertile window starts.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
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
import { CYCLE_SUMMARY, type CyclePrediction, type CycleSummary } from '@/graphql/cycle';
import { APP_COPY } from '@/theme/copy-app';
import { useLang, type Lang } from '@/theme/i18n';

const CHANNEL = 'cycle';
const PREFIX = 'cycle-';
const HOUR = 9;
const DAYS_BEFORE = 2;

const store = createToggle('imara.cycleReminders');
const ROUTES = { cycle: '/cycle' } as const;

// 9:00 local time on a YYYY-MM-DD day, moved by `offset` days.
const at = (day: string, offset = 0): Date => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d + offset, HOUR, 0, 0, 0);
};

const dateLabel = (day: string, lang: Lang): string => {
  try {
    return at(day).toLocaleDateString(lang === 'rn' ? 'fr' : lang, { day: 'numeric', month: 'long' });
  } catch {
    return day;
  }
};

async function cancel(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

async function schedule(lang: Lang, predictions: CyclePrediction[]): Promise<void> {
  const a = APP_COPY[lang];
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: a.cycleReminders,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancel();
  const now = Date.now();
  for (const p of predictions) {
    const soon = at(p.start, -DAYS_BEFORE);
    if (soon.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}period-${p.start}`,
        content: {
          title: a.periodSoonTitle,
          body: a.periodSoonBody.replace('{date}', dateLabel(p.start, lang)),
          data: { kind: 'cycle' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: soon, channelId: CHANNEL },
      });
    }
    const fertile = at(p.fertileStart);
    if (fertile.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}fertile-${p.fertileStart}`,
        content: { title: a.fertileTitle, body: a.fertileBody, data: { kind: 'cycle' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fertile, channelId: CHANNEL },
      });
    }
  }
}

/** Keeps cycle reminders in line with the predictions, and opens the cycle page on a tap. */
export function CycleReminders() {
  const { lang } = useLang();
  const { user, ready } = useSession();
  const on = useSyncExternalStore(store.subscribe, store.get);
  const female = user?.gender === 'female';

  const { data } = useQuery<{ cycleSummary: CycleSummary }>(CYCLE_SUMMARY, { skip: !supported || !female || !on });
  const key = JSON.stringify(data?.cycleSummary.predictions ?? null);

  useNotificationRoutes(ROUTES, ready && female);

  useEffect(() => {
    if (!supported || !ready) return;
    const predictions = JSON.parse(key) as CyclePrediction[] | null;
    if (!on || !female) {
      void cancel();
      return;
    }
    if (!predictions) return;
    void hasPermission().then((granted) => {
      if (granted) void schedule(lang, predictions).catch(() => {});
    });
  }, [ready, on, female, key, lang]);

  return null;
}

/** The cycle reminders switch. */
export function useCycleReminders() {
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
