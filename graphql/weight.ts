// Weight history: one entry per day; the newest day is the profile weight. Field names match the
// backend weight.typeDefs.ts.
import { gql } from '@apollo/client';

export const WEIGHT_HISTORY = gql`
  query WeightHistory($days: Int) {
    weightHistory(days: $days) {
      day
      kg
      bmi
    }
  }
`;

export const LOG_WEIGHT = gql`
  mutation LogWeight($input: LogWeightInput!) {
    logWeight(input: $input) {
      day
      kg
      bmi
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
export type WeightEntry = { __typename?: 'WeightEntry'; day: string; kg: number; bmi: number | null };

/** Matches the backend limits. */
export const WEIGHT_LIMITS = { min: 20, max: 400, historyDays: 365 } as const;
