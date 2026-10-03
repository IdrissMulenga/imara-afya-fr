// Water reminders with a "+1 glass" button (logged in the background on Android). Today's
// reminders follow progress: skipped while on pace, stopped once the goal is met, and showing
// how far along you are. Imported from app/_layout.tsx so the task exists at startup; off in Expo Go.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from '@apollo/client/react';
import type { NotificationResponse, NotificationTaskPayload } from 'expo-notifications';
import { client } from './apollo';
import { getToken } from './tokens';
import { useSession } from './session';
import { Notifications, cancelScheduled, createToggle, ensurePermission, hasPermission, supported } from './notifications';
import { planWater, type WaterProgress } from './water-plan';
import { dayInZone } from './reminder-plan';
import { ADD_WATER, HABIT_SUMMARY, type HabitDay, type HabitSummary } from '@/graphql/habits';
import { APP_COPY } from '@/theme/copy-app';
import { LANGS, useLang, type Lang } from '@/theme/i18n';

export { REMINDER_HOURS } from './water-plan';

const HANDLED_KEY = 'imara.waterHandled';
// The language, goal and time zone of the last plan, so a "+1 glass" tap with the app closed can
// log to the right day and re-plan.
const PLAN_KEY = 'imara.waterPlan';
const CATEGORY = 'water-reminder';
const ACTION = 'add-water';
const CHANNEL = 'water';
const WATER_TASK = 'imara-water-action';
const ID_PREFIX = 'water-';
// Today and the next three days: 16 at most, so every reminder together stays under iOS's
// limit of 64 scheduled notifications (see notifications.ts). Topped up each time the app opens.
const DAYS_AHEAD = 4;

// Loaded only when supported; every use below is behind a `supported` check.
const TaskManager = (supported ? require('expo-task-manager') : null) as typeof import('expo-task-manager');

// Shared on/off state, so every screen showing it updates together.
const enabledStore = createToggle('imara.waterReminders');

if (supported) {
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

type SavedPlan = { lang: Lang; goal: number; timeZone: string | null };

async function loadPlan(): Promise<SavedPlan | null> {
  try {
    const plan = JSON.parse((await SecureStore.getItemAsync(PLAN_KEY)) ?? 'null') as SavedPlan | null;
    return plan && LANGS.includes(plan.lang) && plan.goal > 0 ? plan : null;
  } catch {
    return null;
  }
}

/** Logs one glass if the response is a "+1 glass" tap not already logged, then re-plans today. */
export async function handleWaterResponse(response: NotificationResponse): Promise<void> {
  if (!supported || response.actionIdentifier !== ACTION) return;
  const key = `${response.notification.request.identifier}:${response.notification.date}`;
  if (pending.has(key)) return;
  pending.add(key);

  try {
    const done = await loadHandled();
    if (done.includes(key) || !(await getToken())) return;
    const plan = await loadPlan();
    // The day in the profile's time zone, as the server and the dashboard count it.
    const day = dayInZone(new Date(), plan?.timeZone);
    const result = await client.mutate<{ addWater: HabitDay }>({
      mutation: ADD_WATER,
      variables: { input: { day, glasses: 1 } },
    });
    await SecureStore.setItemAsync(HANDLED_KEY, JSON.stringify([...done, key].slice(-20))).catch(() => {});
    await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});

    const glasses = result.data?.addWater.waterGlasses;
    if (glasses != null && plan && (await enabledStore.load())) {
      await schedule(plan.lang, { glasses, goal: plan.goal }, plan.timeZone).catch(() => {});
    }
    await client.refetchQueries({ include: ['HabitSummary'] }).catch(() => {});
  } catch {
    // ignore: the glass can still be added in the app
  } finally {
    pending.delete(key);
  }
}

// Registers the "+1 glass" button and the Android channel.
async function prepare(lang: Lang): Promise<void> {
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
}

const glassText = (value: number): string => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

// Plans and cancels run one after another, so two close together cannot interleave and leave a
// reminder from an older plan behind, or reminders scheduled after they were turned off.
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
}

/** Replaces the scheduled reminders with a fresh plan for today's progress. */
const schedule = (lang: Lang, progress: WaterProgress, timeZone: string | null): Promise<void> =>
  enqueue(() => replan(lang, progress, timeZone));

async function replan(lang: Lang, progress: WaterProgress, timeZone: string | null): Promise<void> {
  const a = APP_COPY[lang];
  await prepare(lang);
  await cancel();
  if (progress) {
    const plan: SavedPlan = { lang, goal: progress.goal, timeZone };
    await SecureStore.setItemAsync(PLAN_KEY, JSON.stringify(plan)).catch(() => {});
  }

  for (const slot of planWater(new Date(), progress, DAYS_AHEAD)) {
    const body =
      slot.today && progress
        ? a.waterReminderProgress.replace('{done}', glassText(progress.glasses)).replace('{goal}', glassText(progress.goal))
        : a.waterReminderBody;
    await Notifications.scheduleNotificationAsync({
      identifier: `${ID_PREFIX}${slot.date.getTime()}`,
      content: { title: a.waterReminderTitle, body, categoryIdentifier: CATEGORY, data: { kind: 'water' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: slot.date, channelId: CHANNEL },
    });
  }
}

/** Cancels every scheduled water reminder, including the old fixed daily ones (water-9 …). */
const cancel = (): Promise<void> => cancelScheduled((id) => id.startsWith(ID_PREFIX));

/** Asks for notification permission and schedules the reminders. */
export async function enableWaterReminders(lang: Lang): Promise<'enabled' | 'denied'> {
  if (!(await ensurePermission())) return 'denied';
  await schedule(lang, null, null);
  await enabledStore.set(true);
  return 'enabled';
}

/** Development only: shows a water reminder in 5 seconds, to try it without waiting. */
export async function sendTestWaterReminder(lang: Lang): Promise<'sent' | 'denied'> {
  if (!(await ensurePermission())) return 'denied';
  const a = APP_COPY[lang];
  await prepare(lang);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: a.waterReminderTitle,
      body: a.waterReminderBody,
      categoryIdentifier: CATEGORY,
      data: { kind: 'water' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL,
    },
  });
  return 'sent';
}

/** Cancels the water reminders and turns them off. */
export async function disableWaterReminders(): Promise<void> {
  if (!supported) return;
  await enabledStore.set(false);
  await enqueue(cancel);
  await SecureStore.deleteItemAsync(PLAN_KEY).catch(() => {});
}

/** Re-plans enabled reminders for the current language and today's progress. */
async function refresh(lang: Lang, progress: WaterProgress, timeZone: string | null): Promise<void> {
  if (!supported || !(await enabledStore.load())) return;
  if (!(await hasPermission())) return;
  await schedule(lang, progress, timeZone).catch(() => {});
}

/** Cancels the reminders on sign-out but keeps the switch, like the other reminders. */
async function clearForSignOut(): Promise<void> {
  if (!supported) return;
  await enqueue(cancel);
  await SecureStore.deleteItemAsync(PLAN_KEY).catch(() => {});
}

/** Handles "+1 glass" taps while the app runs, and re-plans the reminders whenever the language,
 *  the goal or today's glasses change. */
export function WaterReminders() {
  const { lang } = useLang();
  const { user, ready } = useSession();
  const userId = user?.id;
  const goal = user?.waterGoalGlasses;
  const timeZone = user?.timezone ?? null;
  const enabled = useSyncExternalStore(enabledStore.subscribe, enabledStore.get);

  // Shares the cache with the dashboard, so a glass added anywhere in the app shows up here.
  const { data } = useQuery<{ habitSummary: HabitSummary }>(HABIT_SUMMARY, {
    skip: !supported || !userId || !enabled,
  });
  const today = data?.habitSummary.today;
  // Today as the server counts it (the profile's time zone); a summary from before midnight
  // means nothing logged yet today.
  const glasses = today ? (today.day === dayInZone(new Date(), timeZone) ? today.waterGlasses : 0) : null;

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
    if (!userId) {
      void clearForSignOut();
      return;
    }
    if (!enabled) return;
    void refresh(lang, glasses != null && goal ? { glasses, goal } : null, timeZone);
  }, [ready, userId, enabled, lang, glasses, goal, timeZone]);

  return null;
}

/** Reminder state for settings and the dashboard. */
export function useWaterReminders() {
  const { lang } = useLang();
  const enabled = useSyncExternalStore(enabledStore.subscribe, enabledStore.get);
  const enable = useCallback(() => enableWaterReminders(lang), [lang]);
  const disable = useCallback(() => disableWaterReminders(), []);

  return { supported, enabled, enable, disable };
}
