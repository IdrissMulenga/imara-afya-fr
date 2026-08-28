// graphql/mutations/wellness.ts — daily habits.
import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments';

// One entry: a glass of water, a night's sleep, or a weigh-in.
export const LOG_HABIT = gql`
  mutation LogHabit($input: LogHabitInput!) {
    logHabit(input: $input) { id type value date }
  }
`;

export const REMOVE_HABIT_LOG = gql`
  mutation RemoveHabitLog($id: ID!) {
    removeHabitLog(id: $id)
  }
`;

export const SET_WATER_GOAL = gql`
  mutation SetWaterGoal($glasses: Float!) {
    setWaterGoal(glasses: $glasses) { ${USER_FIELDS} }
  }
`;


/* ------------------------- daily check-in ------------------------- */

// One entry per day — calling this again on the same date edits that entry
// rather than creating a second one.
export const SAVE_CHECK_IN = gql`
  mutation SaveCheckIn($input: CheckInInput!) {
    saveCheckIn(input: $input) { id date mood energy note }
  }
`;

export const REMOVE_CHECK_IN = gql`
  mutation RemoveCheckIn($date: String!) {
    removeCheckIn(date: $date)
  }
`;

/* -------------------------- daily routines ------------------------- */

export const ADD_ROUTINE = gql`
  mutation AddRoutine($input: RoutineInput!) {
    addRoutine(input: $input) { id title icon days time active position done streak }
  }
`;

export const UPDATE_ROUTINE = gql`
  mutation UpdateRoutine($id: ID!, $input: UpdateRoutineInput!) {
    updateRoutine(id: $id, input: $input) { id title icon days time active position }
  }
`;

export const REMOVE_ROUTINE = gql`
  mutation RemoveRoutine($id: ID!) {
    removeRoutine(id: $id)
  }
`;

// Returns the routine with its recomputed streak, so the number moves the
// instant it's ticked rather than waiting for a refetch.
export const SET_ROUTINE_DONE = gql`
  mutation SetRoutineDone($id: ID!, $done: Boolean!, $date: String) {
    setRoutineDone(id: $id, done: $done, date: $date) {
      id title icon days time active position done streak
    }
  }
`;

/* -------------------------- pregnancy ------------------------------ */

export const START_PREGNANCY = gql`
  mutation StartPregnancy($input: StartPregnancyInput!) {
    startPregnancy(input: $input) { id lastPeriodDate endedAt outcome note }
  }
`;

export const UPDATE_PREGNANCY = gql`
  mutation UpdatePregnancy($id: ID!, $input: UpdatePregnancyInput!) {
    updatePregnancy(id: $id, input: $input) { id lastPeriodDate endedAt outcome note }
  }
`;

export const END_PREGNANCY = gql`
  mutation EndPregnancy($id: ID!, $input: EndPregnancyInput!) {
    endPregnancy(id: $id, input: $input) { id lastPeriodDate endedAt outcome note }
  }
`;

export const REMOVE_PREGNANCY = gql`
  mutation RemovePregnancy($id: ID!) {
    removePregnancy(id: $id)
  }
`;
