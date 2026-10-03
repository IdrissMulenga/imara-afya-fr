// Weight history: one entry per day; the newest day is the profile weight. Field names match the
// backend weight.typeDefs.ts.
import { gql } from '@apollo/client';

export const WEIGHT_HISTORY = gql`
  query WeightHistory($days: Int) {
    weightHistory(days: $days) {
      day
      kg
      bmi
      trendKg
    }
  }
`;

export const LOG_WEIGHT = gql`
  mutation LogWeight($input: LogWeightInput!) {
    logWeight(input: $input) {
      day
      kg
      bmi
      trendKg
    }
  }
`;

export const WEIGHT_SUMMARY = gql`
  query WeightSummary {
    weightSummary {
      latest {
        day
        kg
        bmi
        trendKg
      }
      trendKg
      weeklyChangeKg
      goalKg
      toGoalKg
    }
  }
`;

export const DELETE_WEIGHT = gql`
  mutation DeleteWeight($day: String!) {
    deleteWeight(day: $day)
  }
`;

/** day is YYYY-MM-DD in the user's timezone. */
/** bmi uses the current height; null without one. */
/** trendKg is the smoothed weight that day, evening out day-to-day swings. */
export type WeightEntry = { __typename?: 'WeightEntry'; day: string; kg: number; bmi: number | null; trendKg: number };

/** weeklyChangeKg is per week over the last 28 days; toGoalKg is goal minus trend (negative to lose). */
export type WeightSummary = {
  latest: WeightEntry | null;
  trendKg: number | null;
  weeklyChangeKg: number | null;
  goalKg: number | null;
  toGoalKg: number | null;
};

/** Matches the backend limits. */
export const WEIGHT_LIMITS = { min: 20, max: 400, historyDays: 365 } as const;
