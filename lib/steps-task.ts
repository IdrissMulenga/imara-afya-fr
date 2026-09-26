// Background sync of steps and sleep about every 15 minutes (off in Expo Go). Imported from
// app/_layout.tsx so the task exists at startup.
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

/** Registers the background sync task when the OS allows it. */
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

/** Removes the background sync task. */
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
