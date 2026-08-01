// graphql/mutations/wellness.ts — daily habits + Ramadan mode.
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

export const SET_RAMADAN_MODE = gql`
  mutation SetRamadanMode($input: SetRamadanModeInput!) {
    setRamadanMode(input: $input) { ${USER_FIELDS} }
  }
`;
