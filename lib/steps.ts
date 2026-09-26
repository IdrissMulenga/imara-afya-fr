// Automatic step counting and syncing. Modes: hardware (Android counter, counts while
// closed), ios (system history), live (Expo Go, only while open), none.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Pedometer } from 'expo-sensors';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { client } from './apollo';
import { getToken } from './tokens';
import { hasStepCounter, readStepCounter, type StepCounterReading } from '@/modules/step-counter';
import { HABIT_DAY_FIELDS, HABIT_LIMITS, LOG_HABITS, type HabitDay } from '@/graphql/habits';

export type StepMode = 'hardware' | 'ios' | 'live' | 'none';
export type StepPermission = 'granted' | 'denied' | 'undetermined';

const STATE_KEY = 'imara.steps';
// Days of local totals kept on the phone.
const KEEP_DAYS = 3;
// A difference larger than this between two readings is treated as bad data.
const MAX_DELTA = 60_000;

type StepState = {
  /** Local step totals by day (YYYY-MM-DD). */
  totals: Record<string, number>;
  /** Last value sent to the server, by day. */
  synced: Record<string, number>;
  /** Last hardware reading (hardware mode). */
  lastSteps?: number;
  lastBoot?: number;
  /** Time of the last reading, in ms. */
  lastAt?: number;
  /** When counting started on this phone, in ms (iOS counts from here). */
  startedAt?: number;
};

const emptyState = (): StepState => ({ totals: {}, synced: {} });

let state: StepState | null = null;
let running: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** The phone's local calendar day for a time, as YYYY-MM-DD. */
export function localDay(ms: number = Date.now()): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const startOfDay = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const nextMidnight = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
};

/** How steps can be counted on this phone. */
export function stepMode(): StepMode {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return hasStepCounter() ? 'hardware' : 'live';
  return 'none';
}

async function load(): Promise<StepState> {
  if (state) return state;
  try {
    const raw = await SecureStore.getItemAsync(STATE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StepState) : null;
    state = parsed?.totals && parsed?.synced ? parsed : emptyState();
  } catch {
    state = emptyState();
  }
  return state;
}

async function save(next: StepState): Promise<void> {
  const cutoff = localDay(Date.now() - KEEP_DAYS * 86_400_000);
  for (const map of [next.totals, next.synced]) {
    for (const day of Object.keys(map)) if (day < cutoff) delete map[day];
  }
  state = next;
  try {
    await SecureStore.setItemAsync(STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

const notify = () => listeners.forEach((listener) => listener());

/** Subscribes to changes in the local totals. */
export function onStepsChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Local total for a day, from memory (0 until the first sync has loaded state). */
export function getLocalSteps(day: string): number {
  return state?.totals[day] ?? 0;
}

/** The motion permission, without asking. */
export async function getStepPermission(): Promise<StepPermission> {
  try {
    const { granted, canAskAgain } = await Pedometer.getPermissionsAsync();
    return granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Asks for the motion permission. */
export async function requestStepPermission(): Promise<StepPermission> {
  try {
    const { granted, canAskAgain } = await Pedometer.requestPermissionsAsync();
    return granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

// Adds a hardware reading: the steps since the previous reading are spread over
// the days between the two readings in proportion to time.
function recordHardware(s: StepState, reading: StepCounterReading, now: number): void {
  const { lastSteps, lastBoot, lastAt } = s;
  s.lastSteps = reading.steps;
  s.lastBoot = reading.bootTime;
  s.lastAt = now;

  // The first reading is only a baseline.
  if (lastSteps == null || lastBoot == null || lastAt == null) return;

  const rebooted = Math.abs(reading.bootTime - lastBoot) > 60_000 || reading.steps < lastSteps;
  const delta = rebooted ? reading.steps : reading.steps - lastSteps;
  if (delta <= 0 || delta > MAX_DELTA) return;

  const from = rebooted ? Math.max(lastAt, reading.bootTime) : lastAt;
  const span = Math.max(1, now - from);
  let cursor = from;
  let assigned = 0;
  while (cursor < now) {
    const segmentEnd = Math.min(nextMidnight(cursor), now);
    const isLast = segmentEnd >= now;
    const share = isLast ? delta - assigned : Math.round((delta * (segmentEnd - cursor)) / span);
    const day = localDay(cursor);
    s.totals[day] = (s.totals[day] ?? 0) + share;
    assigned += share;
    cursor = segmentEnd;
  }
}

// iOS: today's total since counting started, plus yesterday's final total after midnight.
async function recordIos(s: StepState, now: number): Promise<void> {
  if (s.startedAt == null) s.startedAt = now;
  const startedAt = s.startedAt;
  const todayStart = startOfDay(now);

  const from = Math.max(todayStart, startedAt);
  const { steps } = await Pedometer.getStepCountAsync(new Date(from), new Date(now));
  s.totals[localDay(now)] = steps;

  if (startedAt < todayStart && (s.lastAt == null || s.lastAt < todayStart)) {
    const yesterdayStart = startOfDay(todayStart - 1);
    const previous = await Pedometer.getStepCountAsync(
      new Date(Math.max(yesterdayStart, startedAt)),
      new Date(todayStart),
    );
    s.totals[localDay(yesterdayStart)] = previous.steps;
  }
  s.lastAt = now;
}

/** Adds steps counted live while the app is open (live mode only). */
export async function addLiveSteps(count: number): Promise<void> {
  if (count <= 0) return;
  const s = await load();
  const day = localDay();
  s.totals[day] = (s.totals[day] ?? 0) + count;
  s.lastAt = Date.now();
  await save(s);
  notify();
}

// The server's current value for a day, if it is in the Apollo cache.
function cachedServerSteps(day: string): number {
  try {
    const cached = client.cache.readFragment<HabitDay>({
      id: client.cache.identify({ __typename: 'HabitDay', day }),
      fragment: HABIT_DAY_FIELDS,
    });
    return cached?.steps ?? 0;
  } catch {
    return 0;
  }
}

const REJECTED_DAY = new Set(['FUTURE_DAY', 'DAY_TOO_OLD', 'INVALID_DAY']);

// Sends each day whose total changed. Never lowers a value the server already has.
async function push(s: StepState): Promise<boolean> {
  let sent = false;
  for (const day of Object.keys(s.totals).sort()) {
    const value = Math.min(HABIT_LIMITS.steps, Math.max(s.totals[day], cachedServerSteps(day)));
    s.totals[day] = value;
    if (value === 0 || s.synced[day] === value) continue;

    try {
      await client.mutate({ mutation: LOG_HABITS, variables: { input: { day, steps: value } } });
      s.synced[day] = value;
      sent = true;
    } catch (error) {
      const reason = CombinedGraphQLErrors.is(error)
        ? (error.errors[0]?.extensions as { reason?: string } | undefined)?.reason
        : undefined;
      if (reason && REJECTED_DAY.has(reason)) {
        s.synced[day] = value;
        continue;
      }
      break;
    }
  }
  return sent;
}

/** Takes a reading (if the mode allows) and sends changed totals to the server. */
export function syncSteps(): Promise<void> {
  if (running) return running;
  running = (async () => {
    try {
      const mode = stepMode();
      if (mode === 'none' || !(await getToken())) return;
      if ((await getStepPermission()) !== 'granted') return;

      const s = await load();
      const now = Date.now();
      if (mode === 'hardware') {
        const reading = await readStepCounter();
        if (reading) recordHardware(s, reading, now);
      } else if (mode === 'ios') {
        await recordIos(s, now);
      }

      const sent = await push(s);
      await save(s);
      notify();
      if (sent) await client.refetchQueries({ include: ['HabitSummary'] }).catch(() => {});
    } catch {
      // ignore
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Forgets all local step data (on sign-out). */
export async function clearSteps(): Promise<void> {
  state = emptyState();
  try {
    await SecureStore.deleteItemAsync(STATE_KEY);
  } catch {
    // ignore
  }
  notify();
}
