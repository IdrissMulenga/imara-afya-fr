// Automatic sleep: reads what the phone detected (Google Sleep API on Android,
// Apple Health on iOS) and saves each night's hours on the day the user woke up.
// A night is sent once; a manual −/+ correction is only overwritten if the phone
// later reports different sleep for that night.
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
import { HABIT_LIMITS, LOG_HABITS } from '@/graphql/habits';

const STATE_KEY = 'imara.sleep';
// How far back detected sleep is read and sent.
const LOOKBACK_DAYS = 7;

type SleepState = {
  enabled: boolean;
  /** Last hours sent to the server, by day. */
  synced: Record<string, number>;
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
      if (!s.enabled || !(await getToken())) return;

      // Android subscriptions end on reboot or app update; renewing is harmless.
      if (Platform.OS === 'android') await startSleepTracking();

      const byDay = sleepByDay(await readSleep(Date.now() - LOOKBACK_DAYS * 86_400_000));
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
