// Insights: this week against last week, and mood/energy on goal-met vs goal-missed days. Field names
// match the backend insight.typeDefs.ts.
import { gql } from '@apollo/client';

const PERIOD_FIELDS = `
  start
  end
  waterGlasses
  steps
  sleepHours
  mood
  energy
  waterGoalDays
  stepGoalDays
  sleepGoalDays
  checkInDays
`;

export const INSIGHTS = gql`
  query Insights($days: Int) {
    insights(days: $days) {
      days
      thisWeek { ${PERIOD_FIELDS} }
      lastWeek { ${PERIOD_FIELDS} }
      sleep {
        nights
        usualHours
        variationHours
        regularity
        goalHours
        weekNights
        debtHours
      }
      patterns {
        factor
        outcome
        goalMetAverage
        goalMissedAverage
        goalMetDays
        goalMissedDays
        difference
      }
    }
  }
`;

/** REGULAR_SLEEP is met on a night within an hour of the usual (median) sleep, not a goal. */
export type InsightFactor = 'SLEEP' | 'STEPS' | 'WATER' | 'REGULAR_SLEEP';
export type SleepRegularity = 'STEADY' | 'VARIES' | 'IRREGULAR' | 'UNKNOWN';
export type InsightOutcome = 'MOOD' | 'ENERGY';

/** Seven days (start..end, YYYY-MM-DD). An average is null when nothing was logged. */
export type InsightPeriod = {
  start: string;
  end: string;
  waterGlasses: number | null;
  steps: number | null;
  sleepHours: number | null;
  mood: number | null;
  energy: number | null;
  waterGoalDays: number;
  stepGoalDays: number;
  sleepGoalDays: number;
  checkInDays: number;
};

/** Average mood or energy (1–5) on days the goal was met vs missed. A pattern, not a cause. */
export type InsightPattern = {
  factor: InsightFactor;
  outcome: InsightOutcome;
  goalMetAverage: number;
  goalMissedAverage: number;
  goalMetDays: number;
  goalMissedDays: number;
  /** goalMetAverage minus goalMissedAverage; negative when missed days were better. */
  difference: number;
};

/** Recent sleep. Bedtimes are not recorded, so regularity is about how long, not when. */
export type SleepSummary = {
  /** Nights with sleep recorded in the last 14. */
  nights: number;
  usualHours: number | null;
  variationHours: number | null;
  regularity: SleepRegularity;
  goalHours: number;
  /** Nights with sleep recorded in the last 7 days. */
  weekNights: number;
  /** Hours short of the goal over the nights recorded in the last 7 days. */
  debtHours: number;
};

export type Insights = {
  days: number;
  thisWeek: InsightPeriod;
  lastWeek: InsightPeriod;
  sleep: SleepSummary;
  /** Largest gap first; empty until one qualifies. */
  patterns: InsightPattern[];
};

/** Matches the backend limits. */
export const INSIGHT_LIMITS = { defaultDays: 30, maxDays: 90, minDaysPerSide: 5 } as const;
