// Android hardware step counter (see android/.../StepCounterModule.kt).
// Null on iOS, on web, and in Expo Go, which does not include this module.
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

export type StepCounterReading = {
  /** Steps since the phone booted. */
  steps: number;
  /** Boot time in ms since epoch; changes after a reboot. */
  bootTime: number;
};

type StepCounterNative = {
  isAvailable(): boolean;
  readAsync(timeoutMs: number): Promise<StepCounterReading | null>;
};

const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<StepCounterNative>('StepCounter') : null;

/** True when the native module is installed and the phone has a step counter sensor. */
export function hasStepCounter(): boolean {
  try {
    return Boolean(native?.isAvailable());
  } catch {
    return false;
  }
}

/** One reading of the hardware counter, or null if unavailable or it timed out. */
export async function readStepCounter(timeoutMs = 4000): Promise<StepCounterReading | null> {
  if (!native) return null;
  try {
    return await native.readAsync(timeoutMs);
  } catch {
    return null;
  }
}
