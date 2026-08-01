// hooks/use-dashboard.ts — everything the home dashboard needs, in one place.
//
//   const { me, records, medications, dueToday, cycle, water, markTaken, ... } = useDashboard();
//
// Deliberately one GraphQL round trip. On a 2G connection in Bujumbura, four
// separate requests is four chances to stall before the screen is usable.
import { useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CYCLE_PREDICTION,
  DASHBOARD,
  MARK_MEDICATION_TAKEN,
  type CyclePredictionData,
  type DashboardData,
  type MarkMedicationTakenData,
} from '@/graphql';
import { addDaysIso, todayIso } from '@/lib/dates';

export function useDashboard() {
  const date = todayIso();
  const weekAgo = addDaysIso(date, -6);

  const { data, loading, error, refetch } = useQuery<DashboardData>(DASHBOARD, {
    variables: { date, weekAgo },
    fetchPolicy: 'cache-and-network',
  });

  const me = data?.me ?? null;
  const isWoman = me?.gender === 'Woman';

  // the backend rejects cyclePrediction for non-women (WOMEN_ONLY), so skip it
  const { data: cycleData } = useQuery<CyclePredictionData>(CYCLE_PREDICTION, {
    skip: !isWoman,
    fetchPolicy: 'cache-and-network',
  });

  const [markMutation, { loading: marking }] = useMutation<MarkMedicationTakenData>(
    MARK_MEDICATION_TAKEN,
    { refetchQueries: [{ query: DASHBOARD, variables: { date, weekAgo } }] },
  );

  const records = data?.myHealthRecords ?? [];
  const medications = useMemo(
    () => (data?.myMedications ?? []).filter((m) => m.active),
    [data?.myMedications],
  );
  const logs = data?.myMedicationLogs ?? [];

  // ids of medications already logged today
  const takenIds = useMemo(
    () => new Set(logs.filter((l) => l.status === 'taken').map((l) => l.medicationId)),
    [logs],
  );

  const dueToday = useMemo(
    () => medications.map((m) => ({ ...m, taken: takenIds.has(m.id) })),
    [medications, takenIds],
  );

  const dueCount = dueToday.filter((m) => !m.taken).length;
  const takenCount = dueToday.length - dueCount;

  const habits = data?.habitSummary ?? null;

  // Seven days of water totals, oldest first, with missing days as zero — a
  // gap in the sparkline would read as "no data" when it means "drank none".
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

  const markTaken = (medicationId: string) =>
    markMutation({ variables: { medicationId, status: 'taken' } });

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
    cycle: cycleData?.cyclePrediction ?? null,
    markTaken,
    marking,
    loading,
    error,
    refetch,
  };
}

export default useDashboard;
