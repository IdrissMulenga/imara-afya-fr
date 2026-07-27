// hooks/use-dashboard.ts — everything the home dashboard needs, in one place.
//
//   const { me, records, medications, dueToday, cycle, markTaken, ... } = useDashboard();
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

const todayIso = () => new Date().toISOString().slice(0, 10);

export function useDashboard() {
  const date = todayIso();

  const { data, loading, error, refetch } = useQuery<DashboardData>(DASHBOARD, {
    variables: { date },
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
    { refetchQueries: [{ query: DASHBOARD, variables: { date } }] },
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
    cycle: cycleData?.cyclePrediction ?? null,
    markTaken,
    marking,
    loading,
    error,
    refetch,
  };
}

export default useDashboard;
