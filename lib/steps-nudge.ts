// Schedules the steps nudge: 18:00 when today's steps are under the goal, with today's progress
// in the message. Shared by the in-app component (steps-reminders.tsx) and the background step
// sync (steps-task.ts), and kept apart from steps-provider so neither imports the other.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { client } from './apollo';
import { getToken } from './tokens';
import { Notifications, cancelScheduled, createToggle, hasPermission, supported } from './notifications';
import { getLocalSteps, localDay } from './steps';
import { dayInZone, planSteps } from './reminder-plan';
import { HABIT_SUMMARY, type HabitSummary } from '@/graphql/habits';
import { APP_COPY } from '@/theme/copy-app';
import { LANGS, type Lang } from '@/theme/i18n';

const CHANNEL = 'steps';
const PREFIX = 'steps-';
// The language, goal and time zone of the last plan, so the background step sync can re-plan.
const PLAN_KEY = 'imara.stepsPlan';
// Today and the next two days; topped up each time the app opens.
const DAYS_AHEAD = 3;

/** The steps reminders switch. */
export const stepsStore = createToggle('imara.stepsReminders');

/** Today's steps and goal; null when today's steps are not known (no step counting, no band). */
export type StepsProgress = { steps: number; goal: number } | null;
type SavedPlan = { lang: Lang; goal: number; timeZone: string | null };

const stepText = (value: number): string => Math.round(value).toLocaleString();

// Plans and cancels run one after another, so an older plan cannot leave a reminder behind.
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
}

/** Cancels every steps nudge, after any plan still running. */
export const cancelStepsNudges = (): Promise<void> =>
  enqueue(() => cancelScheduled((id) => id.startsWith(PREFIX)));

/** Replaces the scheduled nudges with a fresh plan for today's progress. */
export const scheduleStepsNudges = (lang: Lang, progress: StepsProgress, timeZone: string | null): Promise<void> =>
  enqueue(() => replan(lang, progress, timeZone));

async function replan(lang: Lang, progress: StepsProgress, timeZone: string | null): Promise<void> {
  const a = APP_COPY[lang];
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: a.stepsReminders,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancelScheduled((id) => id.startsWith(PREFIX));
  if (progress) {
    const plan: SavedPlan = { lang, goal: progress.goal, timeZone };
    await SecureStore.setItemAsync(PLAN_KEY, JSON.stringify(plan)).catch(() => {});
  }

  for (const slot of planSteps(new Date(), progress, DAYS_AHEAD)) {
    const body =
      slot.today && progress
        ? a.stepsReminderProgress.replace('{done}', stepText(progress.steps)).replace('{goal}', stepText(progress.goal))
        : a.stepsReminderBody;
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${slot.day}`,
      content: { title: a.stepsReminderTitle, body, data: { kind: 'steps' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: slot.date, channelId: CHANNEL },
    });
  }
}

/** Forgets the saved plan (when the switch is turned off). */
export const forgetStepsPlan = (): Promise<void> => SecureStore.deleteItemAsync(PLAN_KEY).catch(() => {});

async function loadPlan(): Promise<SavedPlan | null> {
  try {
    const plan = JSON.parse((await SecureStore.getItemAsync(PLAN_KEY)) ?? 'null') as SavedPlan | null;
    return plan && LANGS.includes(plan.lang) && plan.goal > 0 ? plan : null;
  } catch {
    return null;
  }
}

/** Today's steps from the server, if the app's cache still holds them. */
function cachedServerSteps(day: string): number {
  try {
    const today = client.cache.readQuery<{ habitSummary: HabitSummary }>({ query: HABIT_SUMMARY })?.habitSummary.today;
    return today && today.day === day ? (today.steps ?? 0) : 0;
  } catch {
    return 0;
  }
}

/** Called by the background step sync. Only ever drops today's nudge once the goal is reached:
 *  this phone's count misses steps from a band, so it is never used to add or reword one. */
export async function dropStepsNudgeIfMet(): Promise<void> {
  if (!supported || !(await stepsStore.load()) || !(await getToken()) || !(await hasPermission())) return;
  const plan = await loadPlan();
  if (!plan) return;
  // This phone counts steps by its own day; the server by the profile's time zone.
  const steps = Math.max(getLocalSteps(localDay()), cachedServerSteps(dayInZone(new Date(), plan.timeZone)));
  if (steps >= plan.goal) await scheduleStepsNudges(plan.lang, { steps, goal: plan.goal }, plan.timeZone);
}
