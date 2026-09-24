// Water reminders: local notifications at set times with a "+1 glass" button.
// On Android the button logs the glass in the background; on iOS it opens the app,
// which logs it. Imported from app/_layout.tsx so the background task is defined at
// startup.
//
// Off in Expo Go: expo-task-manager and parts of expo-notifications throw on import
// when their native modules are missing, so they are only loaded when supported.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as SecureStore from 'expo-secure-store';
import type { NotificationResponse, NotificationTaskPayload } from 'expo-notifications';
import { client } from './apollo';
import { getToken } from './tokens';
import { localDay } from './steps';
import { useSession } from './session';
import { ADD_WATER } from '@/graphql/habits';
import { APP_COPY } from '@/theme/copy-app';
import { useLang, type Lang } from '@/theme/i18n';

const ENABLED_KEY = 'imara.waterReminders';
const HANDLED_KEY = 'imara.waterHandled';
const CATEGORY = 'water-reminder';
const ACTION = 'add-water';
const CHANNEL = 'water';
const WATER_TASK = 'imara-water-action';

/** Local hours at which a reminder is shown. */
export const REMINDER_HOURS = [9, 12, 15, 18] as const;

const supported = (Platform.OS === 'android' || Platform.OS === 'ios') && !isRunningInExpoGo();

// Loaded only when supported; every use below is behind a `supported` check.
const Notifications = (supported ? require('expo-notifications') : null) as typeof import('expo-notifications');
const TaskManager = (supported ? require('expo-task-manager') : null) as typeof import('expo-task-manager');

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  // Android runs this when "+1 glass" is tapped while the app is in the background or closed.
  TaskManager.defineTask<NotificationTaskPayload>(WATER_TASK, async ({ data }) => {
    if (data && 'actionIdentifier' in data) await handleWaterResponse(data);
    return Notifications.BackgroundNotificationTaskResult.NoData;
  });
  void Notifications.registerTaskAsync(WATER_TASK).catch(() => {});
}

// Taps already logged. Kept on the phone because the last response is reported again
// at every app start, and a tap can reach both the background task and the listener.
const pending = new Set<string>();

async function loadHandled(): Promise<string[]> {
  try {
    return JSON.parse((await SecureStore.getItemAsync(HANDLED_KEY)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/** Logs one glass if the response is a "+1 glass" tap not already logged. */
export async function handleWaterResponse(response: NotificationResponse): Promise<void> {
  if (!supported || response.actionIdentifier !== ACTION) return;
  const key = `${response.notification.request.identifier}:${response.notification.date}`;
  if (pending.has(key)) return;
  pending.add(key);

  try {
    const done = await loadHandled();
    if (done.includes(key) || !(await getToken())) return;
    await client.mutate({ mutation: ADD_WATER, variables: { input: { day: localDay(), glasses: 1 } } });
    await SecureStore.setItemAsync(HANDLED_KEY, JSON.stringify([...done, key].slice(-20))).catch(() => {});
    await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
    await client.refetchQueries({ include: ['HabitSummary'] }).catch(() => {});
  } catch {
    // ignore: the glass can still be added in the app
  } finally {
    pending.delete(key);
  }
}

async function schedule(lang: Lang): Promise<void> {
  const a = APP_COPY[lang];
  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    {
      identifier: ACTION,
      buttonTitle: a.addGlassAction,
      options: { opensAppToForeground: Platform.OS === 'ios' },
    },
  ]);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: a.waterReminders,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancel();
  for (const hour of REMINDER_HOURS) {
    await Notifications.scheduleNotificationAsync({
      identifier: `water-${hour}`,
      content: {
        title: a.waterReminderTitle,
        body: a.waterReminderBody,
        categoryIdentifier: CATEGORY,
        data: { kind: 'water' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
        channelId: CHANNEL,
      },
    });
  }
}

async function cancel(): Promise<void> {
  for (const hour of REMINDER_HOURS) {
    await Notifications.cancelScheduledNotificationAsync(`water-${hour}`).catch(() => {});
  }
}

async function isEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ENABLED_KEY)) === '1';
  } catch {
    return false;
  }
}

// Shared on/off state, so every screen showing it updates together.
let enabledNow = false;
const subscribers = new Set<() => void>();
const setEnabledNow = (value: boolean) => {
  enabledNow = value;
  subscribers.forEach((notify) => notify());
};
const subscribe = (notify: () => void) => {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
};
if (supported) void isEnabled().then(setEnabledNow);

/** Asks for notification permission and schedules the reminders. */
export async function enableWaterReminders(lang: Lang): Promise<'enabled' | 'denied'> {
  if (!supported) return 'denied';
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return 'denied';

  await schedule(lang);
  await SecureStore.setItemAsync(ENABLED_KEY, '1').catch(() => {});
  setEnabledNow(true);
  return 'enabled';
}

export async function disableWaterReminders(): Promise<void> {
  if (!supported) return;
  await cancel();
  await SecureStore.deleteItemAsync(ENABLED_KEY).catch(() => {});
  setEnabledNow(false);
}

/** Re-schedules enabled reminders (e.g. in a new language). */
async function refresh(lang: Lang): Promise<void> {
  if (!supported || !(await isEnabled())) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await schedule(lang).catch(() => {});
}

/** Handles "+1 glass" taps while the app runs, and keeps reminders in the current language. */
export function WaterReminders() {
  const { lang } = useLang();
  const { user, ready } = useSession();
  const userId = user?.id;

  useEffect(() => {
    if (!supported) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleWaterResponse(response);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) void handleWaterResponse(response);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (userId) void refresh(lang);
    else void disableWaterReminders();
  }, [ready, userId, lang]);

  return null;
}

/** Reminder state for settings and the dashboard. */
export function useWaterReminders() {
  const { lang } = useLang();
  const enabled = useSyncExternalStore(subscribe, () => enabledNow);
  const enable = useCallback(() => enableWaterReminders(lang), [lang]);
  const disable = useCallback(() => disableWaterReminders(), []);

  return { supported, enabled, enable, disable };
}
