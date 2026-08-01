// hooks/use-cycle.ts — period tracker. Women only.
//
// The backend rejects every cycle operation with WOMEN_ONLY unless gender is
// "Woman", so this hook skips its queries entirely for everyone else.
import { useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import useMe from '@/hooks/use-me';
import {
  CYCLE_PREDICTION,
  LOG_PERIOD,
  MY_CYCLES,
  REMOVE_PERIOD,
  SET_CYCLE_REGULARITY,
  UPDATE_PERIOD,
  type CyclePredictionData,
  type LogPeriodData,
  type LogPeriodInput,
  type MyCyclesData,
  type RemovePeriodData,
  type SetCycleRegularityData,
  type UpdatePeriodData,
  type UpdatePeriodInput,
} from '@/graphql';

export const todayIso = () => new Date().toISOString().slice(0, 10);

// inclusive day count: a period that starts and ends the same day lasted 1 day
export const periodLength = (startDate: string, endDate?: string | null) => {
  if (!endDate) return null;

  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();

  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
};

export function useCycle() {
  const { me, loading: loadingMe } = useMe();
  const isWoman = me?.gender === 'Woman';

  const { data: cyclesData, loading: loadingCycles, refetch } = useQuery<MyCyclesData>(MY_CYCLES, {
    skip: !isWoman,
    fetchPolicy: 'cache-and-network',
  });

  const { data: predictionData, loading: loadingPrediction } = useQuery<CyclePredictionData>(
    CYCLE_PREDICTION,
    { skip: !isWoman, fetchPolicy: 'cache-and-network' },
  );

  // every write changes both the list and the prediction derived from it
  const refresh = [{ query: MY_CYCLES }, { query: CYCLE_PREDICTION }];

  const [logMutation, { loading: logging }] = useMutation<LogPeriodData>(LOG_PERIOD, {
    refetchQueries: refresh,
  });
  const [updateMutation, { loading: updating }] = useMutation<UpdatePeriodData>(UPDATE_PERIOD, {
    refetchQueries: refresh,
  });
  const [removeMutation, { loading: removing }] = useMutation<RemovePeriodData>(REMOVE_PERIOD, {
    refetchQueries: refresh,
  });
  const [regularityMutation] = useMutation<SetCycleRegularityData>(SET_CYCLE_REGULARITY, {
    // the answer changes how much the prediction is trusted, so refetch it
    refetchQueries: refresh,
  });

  const cycles = cyclesData?.myCycles ?? [];
  const prediction = predictionData?.cyclePrediction ?? null;

  // the backend returns newest first, so the first entry is the current cycle
  const latest = cycles[0] ?? null;

  // an open cycle is one she started but hasn't marked as finished. Its presence
  // is what decides whether the screen offers "log a period" or "period ended".
  const openCycle = useMemo(() => (latest && !latest.endDate ? latest : null), [latest]);

  const logPeriod = (input: LogPeriodInput) => logMutation({ variables: { input } });
  const updatePeriod = (id: string, input: UpdatePeriodInput) =>
    updateMutation({ variables: { id, input } });
  const removePeriod = (id: string) => removeMutation({ variables: { id } });

  const startToday = () => logPeriod({ startDate: todayIso() });

  const setRegularity = (regularity: 'regular' | 'irregular' | 'unknown') =>
    regularityMutation({ variables: { regularity } });

  // closing the open cycle is the other half of tracking — without it endDate
  // stays empty forever and period length can never be worked out
  const endToday = () => {
    if (!openCycle) return Promise.resolve(null);

    return updatePeriod(openCycle.id, { endDate: todayIso() });
  };

  return {
    isWoman,
    cycles,
    latest,
    openCycle,
    prediction,
    logPeriod,
    updatePeriod,
    removePeriod,
    startToday,
    endToday,
    setRegularity,
    // she hasn't answered the regular/irregular question yet
    needsRegularityAnswer: !!prediction && prediction.regularity === 'unknown',
    saving: logging || updating,
    removing,
    loading: loadingMe || loadingCycles || loadingPrediction,
    refetch,
  };
}

export default useCycle;
