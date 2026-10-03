// The steps nudge in the app: keeps it in line with today's steps (from this phone and the band),
// opens the steps page on a tap, and provides the Settings switch. Scheduling is in steps-nudge.ts.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useQuery } from '@apollo/client/react';
import { ensurePermission, hasPermission, supported, useNotificationRoutes } from './notifications';
import { useSession } from './session';
import { useSteps } from './steps-provider';
import { dayInZone } from './reminder-plan';
import { cancelStepsNudges, forgetStepsPlan, scheduleStepsNudges, stepsStore } from './steps-nudge';
import { HABIT_SUMMARY, type HabitSummary } from '@/graphql/habits';
import { useLang } from '@/theme/i18n';

// Steps are re-planned only when they cross one of these steps, not on every step.
const STEP_BUCKET = 500;

const ROUTES = { steps: '/(app)/steps' } as const;

/** Keeps the steps nudge in line with today's steps, and opens the steps page on a tap. */
export function StepsReminders() {
  const { lang } = useLang();
  const { user, ready } = useSession();
  const userId = user?.id;
  const goal = user?.stepGoal;
  const timeZone = user?.timezone ?? null;
  const on = useSyncExternalStore(stepsStore.subscribe, stepsStore.get);
  const { active, localToday: phoneSteps } = useSteps();

  // Shares the cache with the dashboard, so the band's steps synced anywhere show up here.
  const { data } = useQuery<{ habitSummary: HabitSummary }>(HABIT_SUMMARY, {
    skip: !supported || !userId || !on,
  });
  // The server's steps for today as it counts days (the profile's time zone), and this phone's.
  const serverToday = data?.habitSummary.today;
  const serverSteps =
    serverToday && serverToday.day === dayInZone(new Date(), timeZone) ? serverToday.steps : null;
  const steps = Math.max(serverSteps ?? 0, phoneSteps);
  // Known when this phone counts steps or the band has sent today's; otherwise the nudge
  // uses the general message instead of "0 of 8,000".
  const known = !!data && (active || serverSteps != null);
  // Re-plan when the goal is crossed or another STEP_BUCKET steps are walked.
  const bucket = goal && steps >= goal ? 'met' : String(Math.floor(steps / STEP_BUCKET));

  useNotificationRoutes(ROUTES, ready && !!userId);

  useEffect(() => {
    if (!supported || !ready) return;
    if (!userId || !on) {
      void cancelStepsNudges();
      return;
    }
    void hasPermission().then((granted) => {
      if (granted) void scheduleStepsNudges(lang, known && goal ? { steps, goal } : null, timeZone).catch(() => {});
    });
    // steps is read through bucket, so a re-plan is not triggered by every step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, on, lang, goal, known, bucket, timeZone]);

  return null;
}

/** The steps reminders switch. */
export function useStepsReminders() {
  const enabled = useSyncExternalStore(stepsStore.subscribe, stepsStore.get);
  const set = useCallback(async (next: boolean): Promise<'enabled' | 'denied' | 'disabled'> => {
    if (!next) {
      await stepsStore.set(false);
      await forgetStepsPlan();
      return 'disabled';
    }
    if (!(await ensurePermission())) return 'denied';
    await stepsStore.set(true);
    return 'enabled';
  }, []);
  return { supported, enabled, set };
}
