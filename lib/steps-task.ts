// Background sync of steps and sleep, roughly every 15 minutes while the app is
// closed (the OS decides the exact timing). Imported from app/_layout.tsx so the task
// is defined at startup, including when the OS launches the app only to run it.
//
// The task packages are loaded only outside Expo Go: they throw on import when their
// native module is missing, and Expo Go on Android does not include TaskManager.
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { syncHealth } from './sync';

type TaskManagerModule = typeof import('expo-task-manager');
type BackgroundTaskModule = typeof import('expo-background-task');

const available = Platform.OS !== 'web' && !isRunningInExpoGo();
const TaskManager: TaskManagerModule | null = available ? require('expo-task-manager') : null;
const BackgroundTask: BackgroundTaskModule | null = available ? require('expo-background-task') : null;

export const STEPS_TASK = 'imara-steps-sync';

if (TaskManager && BackgroundTask) {
  const { BackgroundTaskResult } = BackgroundTask;
  TaskManager.defineTask(STEPS_TASK, async () => {
    try {
      await syncHealth();
      return BackgroundTaskResult.Success;
    } catch {
      return BackgroundTaskResult.Failed;
    }
  });
}

export async function registerStepsTask(): Promise<void> {
  if (!TaskManager || !BackgroundTask) return;
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (await TaskManager.isTaskRegisteredAsync(STEPS_TASK)) return;
    await BackgroundTask.registerTaskAsync(STEPS_TASK, { minimumInterval: 15 });
  } catch {
    // ignore
  }
}

export async function unregisterStepsTask(): Promise<void> {
  if (!TaskManager || !BackgroundTask) return;
  try {
    if (await TaskManager.isTaskRegisteredAsync(STEPS_TASK)) {
      await BackgroundTask.unregisterTaskAsync(STEPS_TASK);
    }
  } catch {
    // ignore
  }
}
