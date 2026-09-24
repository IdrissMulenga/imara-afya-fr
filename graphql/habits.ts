// Daily habits: water, steps and sleep. Field names match the backend habit.typeDefs.ts.
import { gql } from '@apollo/client';

export const HABIT_DAY_FIELDS = gql`
  fragment HabitDayFields on HabitDay {
    day
    waterGlasses
    steps
    sleepHours
  }
`;

export const HABIT_SUMMARY = gql`
  ${HABIT_DAY_FIELDS}
  query HabitSummary {
    habitSummary {
      today {
        ...HabitDayFields
      }
      streaks {
        water
        steps
        sleep
      }
    }
  }
`;

export const HABIT_HISTORY = gql`
  ${HABIT_DAY_FIELDS}
  query HabitHistory($days: Int) {
    habitHistory(days: $days) {
      ...HabitDayFields
    }
  }
`;

export const ADD_WATER = gql`
  ${HABIT_DAY_FIELDS}
  mutation AddWater($input: AddWaterInput!) {
    addWater(input: $input) {
      ...HabitDayFields
    }
  }
`;

export const LOG_HABITS = gql`
  ${HABIT_DAY_FIELDS}
  mutation LogHabits($input: LogHabitsInput!) {
    logHabits(input: $input) {
      ...HabitDayFields
    }
  }
`;

/** day is YYYY-MM-DD in the user's timezone. */
export type HabitDay = {
  __typename?: 'HabitDay';
  day: string;
  waterGlasses: number;
  steps: number;
  sleepHours: number;
};

export type HabitStreaks = { water: number; steps: number; sleep: number };

export type HabitSummary = { today: HabitDay; streaks: HabitStreaks };

/** Matches the backend limits. */
export const HABIT_LIMITS = { water: 50, steps: 200_000, sleep: 24 } as const;
