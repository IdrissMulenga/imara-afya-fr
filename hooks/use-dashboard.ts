// hooks/use-dashboard.ts — everything the home dashboard needs, in one place.
//
//   const { me, dueToday, routines, checkIn, pregnancy, ... } = useDashboard();
//
// TWO round trips, not seven. On a 2G connection in Bujumbura every extra
// request is another chance to stall before the screen is usable, so the
// dashboard asks for medicines, habits, routines and the check-in together, and
// women additionally get cycle + pregnancy in one more.
//
// The dashboard can also WRITE — tick a dose, tick a routine, save a mood —
// because making someone open three screens to record thirty seconds of their
// morning is how a health app stops being used.
import { useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  DASHBOARD,
  DASHBOARD_WOMEN,
  MARK_MEDICATION_TAKEN,
  SAVE_CHECK_IN,
  SET_ROUTINE_DONE,
  type DashboardData,
  type DashboardWomenData,
  type MarkMedicationTakenData,
  type SaveCheckInData,
  type SetRoutineDoneData,
} from '@/graphql';
import { addDaysIso, todayIso } from '@/lib/dates';
import { buildDueDoses, outstandingCount, takenCountOf } from '@/lib/doses';

export function useDashboard() {
  const date = todayIso();
  const weekAgo = addDaysIso(date, -6);

  const { data, loading, error, refetch } = useQuery<DashboardData>(DASHBOARD, {
    variables: { date, weekAgo },
    fetchPolicy: 'cache-and-network',
  });

  const me = data?.me ?? null;
  const isWoman = me?.gender === 'Woman';

  // the backend answers both of these with WOMEN_ONLY for everyone else
  const { data: womenData } = useQuery<DashboardWomenData>(DASHBOARD_WOMEN, {
    skip: !isWoman,
    fetchPolicy: 'cache-and-network',
  });

  // EVERY MUTATION REFETCHES THE SAME DOCUMENT, with the same variables.
  //
  // Apollo caches on the query PLUS its variables, so a refetch that passes a
  // different `date` writes to a different cache entry and the screen you are
  // looking at never updates. That has already caught us once: ticking a dose
  // refreshed a copy of the dashboard nobody was watching.
  const refresh = [{ query: DASHBOARD, variables: { date, weekAgo } }];

  const [markMutation, { loading: marking }] = useMutation<MarkMedicationTakenData>(
    MARK_MEDICATION_TAKEN,
    { refetchQueries: refresh },
  );

  const [routineMutation, { loading: tickingRoutine }] = useMutation<SetRoutineDoneData>(
    SET_ROUTINE_DONE,
    { refetchQueries: refresh },
  );

  const [checkInMutation, { loading: savingCheckIn }] = useMutation<SaveCheckInData>(
    SAVE_CHECK_IN,
    { refetchQueries: refresh },
  );

  const records = data?.myHealthRecords ?? [];
  const medications = useMemo(
    () => (data?.myMedications ?? []).filter((m) => m.active),
    [data?.myMedications],
  );
  const logs = data?.myMedicationLogs ?? [];

  // ONE ENTRY PER SCHEDULED TIME. Ticking the 08:00 dose of a twice-daily
  // medicine must leave the 20:00 one outstanding — before this, it didn't.
  const dueToday = useMemo(() => buildDueDoses(medications, logs), [medications, logs]);

  const dueCount = outstandingCount(dueToday);
  const takenCount = takenCountOf(dueToday);

  const habits = data?.habitSummary ?? null;
  const checkIn = data?.checkInSummary ?? null;

  const routineDay = data?.todayRoutines ?? null;
  const routines = routineDay?.routines ?? [];

  // Seven days of water totals, oldest first, with missing days as zero — a
  // gap in the chart would read as "no data" when it means "drank none".
  const waterWeek = useMemo(() => {
    const byDay = new Map<string, number>();

    for (const log of data?.myHabitLogs ?? []) {
      byDay.set(log.date, (byDay.get(log.date) ?? 0) + log.value);
    }

    return Array.from({ length: 7 }, (_, i) => {
      const day = addDaysIso(weekAgo, i);
      return { date: day, value: byDay.get(day) ?? 0 };
    });
  }, [data?.myHabitLogs, weekAgo]);

  const markTaken = (medicationId: string, slot?: string | null) =>
    markMutation({ variables: { medicationId, slot: slot ?? undefined, status: 'taken' } });

  const setRoutineDone = (id: string, done: boolean) =>
    routineMutation({ variables: { id, done, date } });

  // mood and energy are always saved together — the backend requires both, and
  // "how are you" without "how much have you got left" is half a picture
  const saveCheckIn = (mood: number, energy: number) =>
    checkInMutation({ variables: { input: { mood, energy, date } } });

  return {
    me,
    isWoman,
    records,
    recordCount: records.length,
    medications,
    dueToday,
    dueCount,
    takenCount,
    habits,
    waterWeek,
    checkIn,
    routines,
    routinesDone: routineDay?.doneCount ?? 0,
    routinesDue: routineDay?.dueCount ?? 0,
    cycle: womenData?.cyclePrediction ?? null,
    pregnancy: womenData?.pregnancyProgress ?? null,
    markTaken,
    setRoutineDone,
    saveCheckIn,
    marking,
    tickingRoutine,
    savingCheckIn,
    loading,
    error,
    refetch,
  };
}

export default useDashboard;
