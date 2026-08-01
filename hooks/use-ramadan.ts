// hooks/use-ramadan.ts — Ramadan mode + fasting-window dose times.
//
//   const { schedule, save } = useRamadan();
import { useMutation, useQuery } from '@apollo/client/react';

import {
  ME,
  RAMADAN_SCHEDULE,
  SET_RAMADAN_MODE,
  type RamadanScheduleData,
  type SetRamadanModeData,
  type SetRamadanModeInput,
} from '@/graphql';

export function useRamadan() {
  const { data, loading, error, refetch } = useQuery<RamadanScheduleData>(RAMADAN_SCHEDULE, {
    fetchPolicy: 'cache-and-network',
  });

  const [saveMutation, { loading: saving }] = useMutation<SetRamadanModeData>(SET_RAMADAN_MODE, {
    // the times live on the user, the schedule is derived from them
    refetchQueries: [{ query: RAMADAN_SCHEDULE }, { query: ME }],
  });

  const schedule = data?.ramadanSchedule ?? null;

  const save = (input: SetRamadanModeInput) => saveMutation({ variables: { input } });

  // medications whose times the backend actually moved
  const shifted =
    schedule?.medications.filter(
      (m) => m.adjustedTimes.join(',') !== m.originalTimes.join(','),
    ) ?? [];

  return {
    schedule,
    enabled: schedule?.enabled ?? false,
    shifted,
    save,
    saving,
    loading,
    error,
    refetch,
  };
}

export default useRamadan;
