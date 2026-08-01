// hooks/use-habits.ts — daily habits: water, sleep, weight.
//
//   const { summary, addWater, logSleep, logWeight } = useHabits();
import { useMutation, useQuery } from '@apollo/client/react';

import {
  HABIT_SUMMARY,
  LOG_HABIT,
  ME,
  SET_WATER_GOAL,
  type HabitSummaryData,
  type LogHabitData,
  type SetWaterGoalData,
} from '@/graphql';

export function useHabits() {
  const { data, loading, error, refetch } = useQuery<HabitSummaryData>(HABIT_SUMMARY, {
    fetchPolicy: 'cache-and-network',
  });

  const refresh = [{ query: HABIT_SUMMARY }];

  const [logMutation, { loading: logging }] = useMutation<LogHabitData>(LOG_HABIT, {
    refetchQueries: refresh,
  });
  const [goalMutation, { loading: savingGoal }] = useMutation<SetWaterGoalData>(SET_WATER_GOAL, {
    // the goal lives on the user, so refresh both
    refetchQueries: [...refresh, { query: ME }],
  });

  const summary = data?.habitSummary ?? null;

  // one glass at a time — the backend sums each day's entries
  const addWater = () => logMutation({ variables: { input: { type: 'water', value: 1 } } });
  const logSleep = (hours: number) =>
    logMutation({ variables: { input: { type: 'sleep', value: hours } } });
  const logWeight = (kg: number) =>
    logMutation({ variables: { input: { type: 'weight', value: kg } } });

  const setWaterGoal = (glasses: number) => goalMutation({ variables: { glasses } });

  return {
    summary,
    addWater,
    logSleep,
    logWeight,
    setWaterGoal,
    logging,
    savingGoal,
    loading,
    error,
    refetch,
  };
}

export default useHabits;
