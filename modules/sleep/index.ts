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

/** Detected sleep intervals since `sinceMs`. On iOS, "in bed" is used only when no asleep data exists. */
export async function readSleep(sinceMs: number): Promise<SleepInterval[]> {
  if (!native) return [];
  try {
    if (Platform.OS === 'android') {
      return native
        .getSegments()
        .filter((s) => s.status === 0 && s.end > sinceMs)
        .map(({ start, end }) => ({ start, end }));
    }
    const samples = await native.getSamplesAsync(sinceMs, Date.now());
    const asleep = samples.filter((s) => IOS_ASLEEP.has(s.value));
    const chosen = asleep.length ? asleep : samples.filter((s) => s.value === IOS_IN_BED);
    return chosen.map(({ start, end }) => ({ start, end }));
  } catch {
    return [];
  }
}
