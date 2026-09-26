// Automatic sleep: Google Sleep API on Android, Apple Health on iOS (see the native
// sources). Null on web and in Expo Go, which do not include this module.
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

/** A sleep interval in ms since epoch. */
export type SleepInterval = { start: number; end: number };

type AndroidSleep = {
  isAvailable(): boolean;
  subscribeAsync(): Promise<boolean>;
  unsubscribeAsync(): Promise<void>;
  getSegments(): { start: number; end: number; status: number }[];
  getClassifications(): { time: number; confidence: number }[];
  clearSegments(): void;
};

type IosSleep = {
  isAvailable(): boolean;
  requestAuthorizationAsync(): Promise<boolean>;
  getSamplesAsync(startMs: number, endMs: number): Promise<{ start: number; end: number; value: number }[]>;
};

const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<AndroidSleep & IosSleep>('Sleep');

// HealthKit values that mean asleep (unspecified, core, deep, REM), and in bed.
const IOS_ASLEEP = new Set([1, 3, 4, 5]);
const IOS_IN_BED = 0;

// Android fallback, from the ~10-minute classify readings, for nights Google sent no segment for.
const ASLEEP_CONFIDENCE = 75;
const MINUTE = 60_000;
// Each reading covers the 10 minutes before it.
const READING = 10 * MINUTE;
// Readings further apart than this break a run (the phone missed readings).
const MAX_READING_GAP = 25 * MINUTE;
// Awake stretches up to this long inside a night are joined.
const MAX_WAKE_GAP = 30 * MINUTE;
const MIN_RUN = 60 * MINUTE;
const MIN_NIGHT = 2 * 60 * MINUTE;

const dayOf = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Night-time: the middle of the run falls between 20:00 and 10:00 local time.
const atNight = ({ start, end }: SleepInterval): boolean => {
  const hour = new Date((start + end) / 2).getHours();
  return hour >= 20 || hour < 10;
};

/** Sleep intervals from classify readings: runs of confident readings at night, with
 *  short awake stretches joined, and nights under 2 hours dropped. */
export function estimateFromClassify(readings: { time: number; confidence: number }[]): SleepInterval[] {
  const sorted = [...readings].sort((a, b) => a.time - b.time);
  const runs: SleepInterval[] = [];
  let run: SleepInterval | null = null;
  let lastTime = 0;
  for (const { time, confidence } of sorted) {
    const asleep = confidence >= ASLEEP_CONFIDENCE;
    if (run && (!asleep || time - lastTime > MAX_READING_GAP)) {
      runs.push(run);
      run = null;
    }
    if (asleep) run = run ? { start: run.start, end: time } : { start: time - READING, end: time };
    lastTime = time;
  }
  if (run) runs.push(run);

  const joined: SleepInterval[] = [];
  for (const next of runs) {
    const last = joined[joined.length - 1];
    if (last && next.start - last.end <= MAX_WAKE_GAP) last.end = next.end;
    else joined.push({ ...next });
  }

  const nights = joined.filter((r) => r.end - r.start >= MIN_RUN && atNight(r));
  const total: Record<string, number> = {};
  for (const r of nights) total[dayOf(r.end)] = (total[dayOf(r.end)] ?? 0) + (r.end - r.start);
  return nights.filter((r) => total[dayOf(r.end)] >= MIN_NIGHT);
}

/** True when this phone can track sleep automatically. */
export function hasSleepTracking(): boolean {
  try {
    return Boolean(native?.isAvailable());
  } catch {
    return false;
  }
}

/** Android: starts or renews sleep updates. iOS: shows the Health permission sheet. */
export async function startSleepTracking(): Promise<boolean> {
  if (!native) return false;
  try {
    return Platform.OS === 'ios' ? await native.requestAuthorizationAsync() : await native.subscribeAsync();
  } catch {
    return false;
  }
}

/** Stops sleep updates and forgets stored segments (Android). */
export async function stopSleepTracking(): Promise<void> {
  if (!native) return;
  try {
    if (Platform.OS === 'android') {
      await native.unsubscribeAsync();
      native.clearSegments();
    }
  } catch {
    // ignore
  }
}

/** Detected sleep intervals since `sinceMs`. Android: Google's segments, or an estimate from
 *  its classify readings for nights without one. iOS: "in bed" only when no asleep data exists. */
export async function readSleep(sinceMs: number): Promise<SleepInterval[]> {
  if (!native) return [];
  try {
    if (Platform.OS === 'android') {
      const segments = native
        .getSegments()
        .filter((s) => s.status === 0 && s.end > sinceMs)
        .map(({ start, end }) => ({ start, end }));
      const covered = new Set(segments.map((s) => dayOf(s.end)));
      const estimated = estimateFromClassify(native.getClassifications()).filter(
        (r) => r.end > sinceMs && !covered.has(dayOf(r.end)),
      );
      return [...segments, ...estimated];
    }
    const samples = await native.getSamplesAsync(sinceMs, Date.now());
    const asleep = samples.filter((s) => IOS_ASLEEP.has(s.value));
    const chosen = asleep.length ? asleep : samples.filter((s) => s.value === IOS_IN_BED);
    return chosen.map(({ start, end }) => ({ start, end }));
  } catch {
    return [];
  }
}
