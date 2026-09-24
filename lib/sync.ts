// Syncs everything the phone measures on its own: steps and sleep.
import { syncSteps } from './steps';
import { syncSleep } from './sleep';

export async function syncHealth(): Promise<void> {
  await Promise.all([syncSteps(), syncSleep()]);
}
