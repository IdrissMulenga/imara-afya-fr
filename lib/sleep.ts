// Automatic sleep from the phone (Sleep API / Apple Health), or from the sleep schedule on
// nights with nothing detected; saved on the day the user woke up.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Pedometer } from 'expo-sensors';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { client } from './apollo';
import { getToken } from './tokens';
import { localDay } from './steps';
import {
  hasSleepTracking,
  readSleep,
  startSleepTracking,
  stopSleepTracking,
  type SleepInterval,
} from '@/modules/sleep';
import { HABIT_DAY_FIELDS, HABIT_LIMITS, LOG_HABITS, type HabitDay } from '@/graphql/habits';
import { estimateNight, nightWindow, scheduleFor, type SleepSchedules } from './sleep-schedule';

const STATE_KEY = 'imara.sleep';
// How far back detected sleep is read and sent.
const LOOKBACK_DAYS = 7;
// How many recent nights are estimated from the schedule.
const SCHEDULE_NIGHTS = 3;
// A night is estimated once this long has passed since the scheduled wake-up.
const AFTER_WAKE = 30 * 60_000;

type SleepState = {
  enabled: boolean;
  /** Last hours sent to the server, by day. */
  synced: Record<string, number>;
  /** The sleep schedule, and when it was set (nights before that are not estimated). */
  schedule?: SleepSchedules & { since: number };
};

let state: SleepState | null = null;
let running: Promise<void> | null = null;

async function load(): Promise<SleepState> {
  if (state) return state;
  try {
    const raw = await SecureStore.getItemAsync(STATE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SleepState) : null;
    state = parsed?.synced ? parsed : { enabled: false, synced: {} };
  } catch {
    state = { enabled: false, synced: {} };
  }
  return state;
}

async function save(next: SleepState): Promise<void> {
  const cutoff = localDay(Date.now() - (LOOKBACK_DAYS + 3) * 86_400_000);
  for (const day of Object.keys(next.synced)) if (day < cutoff) delete next.synced[day];
  state = next;
  try {
    await SecureStore.setItemAsync(STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** True when this phone can track sleep automatically. */
export const sleepSupported = (): boolean => hasSleepTracking();

/** True once automatic sleep tracking has been switched on. */
export async function isSleepEnabled(): Promise<boolean> {
  return (await load()).enabled;
}

/** Hours of sleep per wake-up day: overlapping intervals merged, rounded to 15 minutes. */
export function sleepByDay(intervals: SleepInterval[]): Record<string, number> {
  const sorted = [...intervals].filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const merged: SleepInterval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) last.end = Math.max(last.end, interval.end);
    else merged.push({ ...interval });
  }

  const ms: Record<string, number> = {};
  for (const { start, end } of merged) {
    const day = localDay(end);
    ms[day] = (ms[day] ?? 0) + (end - start);
  }

  const hours: Record<string, number> = {};
  for (const [day, total] of Object.entries(ms)) {
    hours[day] = Math.min(HABIT_LIMITS.sleep, Math.round((total / 3_600_000) * 4) / 4);
  }
  return hours;
}

/** Stores the user's sleep schedule (null clears it) and syncs. */
export async function setSleepSchedule(schedules: SleepSchedules | null): Promise<void> {
  const s = await load();
  const current = s.schedule;
  if (!schedules) {
    if (!current) return;
    delete s.schedule;
  } else {
    const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);
    if (current && same(current.weekday, schedules.weekday) && same(current.weekend, schedules.weekend)) return;
    s.schedule = { ...schedules, since: current?.since ?? Date.now() };
  }
  await save(s);
  void syncSleep();
}

// Sleep hours the server has for a day, if it is in the Apollo cache.
function cachedServerSleep(day: string): number {
  try {
    const cached = client.cache.readFragment<HabitDay>({
      id: client.cache.identify({ __typename: 'HabitDay', day }),
      fragment: HABIT_DAY_FIELDS,
    });
    return cached?.sleepHours ?? 0;
  } catch {
    return 0;
  }
}

const roundHours = (ms: number): number => Math.min(HABIT_LIMITS.sleep, Math.round((ms / 3_600_000) * 4) / 4);

// Schedule estimates for recent nights the phone has nothing for, not yet sent, and not
// entered by hand.
async function scheduleNights(s: SleepState, phone: Record<string, number>): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const schedule = s.schedule;
  if (!schedule) return result;
  const now = Date.now();
  for (let d = 0; d < SCHEDULE_NIGHTS; d++) {
    const day = localDay(now - d * 86_400_000);
    if (phone[day] || s.synced[day] != null || cachedServerSleep(day) > 0) continue;
    const night = scheduleFor(day, schedule);
    const window = nightWindow(day, night);
    if (now < window.end + AFTER_WAKE || schedule.since > window.end) continue;
    const intervals = await estimateNight(day, night);
    const hours = roundHours(intervals.reduce((total, i) => total + (i.end - i.start), 0));
    if (hours > 0) result[day] = hours;
  }
  return result;
}

/** Asks for the permission (Android: physical activity; iOS: Health) and starts tracking. */
export async function enableSleep(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const permission = await Pedometer.requestPermissionsAsync().catch(() => null);
    if (!permission?.granted) return false;
  }
  if (!(await startSleepTracking())) return false;

  const s = await load();
  await save({ ...s, enabled: true });
  void syncSleep();
  return true;
}

const REJECTED_DAY = new Set(['FUTURE_DAY', 'DAY_TOO_OLD', 'INVALID_DAY']);

/** Reads detected sleep and sends nights that are new or changed. */
export function syncSleep(): Promise<void> {
  if (running) return running;
  running = (async () => {
    try {
      const s = await load();
      if ((!s.enabled && !s.schedule) || !(await getToken())) return;

      let phone: Record<string, number> = {};
      if (s.enabled) {
        // Android subscriptions end on reboot or app update; renewing is harmless.
        if (Platform.OS === 'android') await startSleepTracking();
        phone = sleepByDay(await readSleep(Date.now() - LOOKBACK_DAYS * 86_400_000));
      }
      const byDay = { ...(await scheduleNights(s, phone)), ...phone };
      let sent = false;
      for (const day of Object.keys(byDay).sort()) {
        const hours = byDay[day];
        if (hours <= 0 || s.synced[day] === hours) continue;
        try {
          await client.mutate({ mutation: LOG_HABITS, variables: { input: { day, sleepHours: hours } } });
          s.synced[day] = hours;
          sent = true;
        } catch (error) {
          const reason = CombinedGraphQLErrors.is(error)
            ? (error.errors[0]?.extensions as { reason?: string } | undefined)?.reason
            : undefined;
          if (reason && REJECTED_DAY.has(reason)) {
            s.synced[day] = hours;
            continue;
          }
          break;
        }
      }

      await save(s);
      if (sent) await client.refetchQueries({ include: ['HabitSummary'] }).catch(() => {});
    } catch {
      // ignore
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Stops tracking and forgets local sleep data (on sign-out). */
export async function clearSleep(): Promise<void> {
  await stopSleepTracking();
  state = { enabled: false, synced: {} };
  try {
    await SecureStore.deleteItemAsync(STATE_KEY);
  } catch {
    // ignore
  }
}
