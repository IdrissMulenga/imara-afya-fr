// Which water reminders to schedule: every slot on the days ahead, but today only the slots where
// the user is behind pace for their goal, and none once the goal is met.

/** Local hours at which a reminder can be shown. */
export const REMINDER_HOURS = [9, 12, 15, 18] as const;

// The pace runs from none expected at 8:00 to the whole goal by 20:00.
const PACE_START_HOUR = 8;
const PACE_END_HOUR = 20;

/** Today's glasses and goal; null when they are not known yet. */
export type WaterProgress = { glasses: number; goal: number } | null;

export type WaterSlot = {
  date: Date;
  /** A slot later today, shown with today's progress in its message. */
  today: boolean;
};

/** Glasses expected by `hour` to stay on pace for `goal`. */
export const expectedBy = (hour: number, goal: number): number => {
  const share = (hour - PACE_START_HOUR) / (PACE_END_HOUR - PACE_START_HOUR);
  return goal * Math.min(1, Math.max(0, share));
};

/** The reminders from `now` over `days` days (today counts as one). With unknown progress,
 *  today keeps every remaining slot. */
export function planWater(now: Date, progress: WaterProgress, days: number): WaterSlot[] {
  const slots: WaterSlot[] = [];
  for (let d = 0; d < days; d++) {
    for (const hour of REMINDER_HOURS) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      date.setHours(hour, 0, 0, 0);
      if (date.getTime() <= now.getTime()) continue;

      const today = d === 0;
      if (today && progress) {
        const { glasses, goal } = progress;
        if (glasses >= goal || glasses >= expectedBy(hour, goal)) continue;
      }
      slots.push({ date, today });
    }
  }
  return slots;
}
