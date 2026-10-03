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

export type InsightFactor = 'SLEEP' | 'STEPS' | 'WATER';
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

export type Insights = {
  days: number;
  thisWeek: InsightPeriod;
  lastWeek: InsightPeriod;
  /** Largest gap first; empty until one qualifies. */
  patterns: InsightPattern[];
};

/** Matches the backend limits. */
export const INSIGHT_LIMITS = { defaultDays: 30, maxDays: 90, minDaysPerSide: 5 } as const;
