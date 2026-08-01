// hooks/use-medications.ts — medication list, today's doses, add / edit / remove.
//
//   const { medications, dueToday, add, markTaken } = useMedications();
import { useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  ADD_MEDICATION,
  DASHBOARD,
  MARK_MEDICATION_TAKEN,
  MY_MEDICATIONS,
  REMOVE_MEDICATION,
  UPDATE_MEDICATION,
  type AddMedicationData,
  type AddMedicationInput,
  type DashboardData,
  type MarkMedicationTakenData,
  type RemoveMedicationData,
  type UpdateMedicationData,
  type UpdateMedicationInput,
} from '@/graphql';

const todayIso = () => new Date().toISOString().slice(0, 10);

export function useMedications() {
  const date = todayIso();

  // the dashboard query already returns medications + today's logs together,
  // so reuse it here instead of firing two more round trips
  const { data, loading, error, refetch } = useQuery<DashboardData>(DASHBOARD, {
    variables: { date },
    fetchPolicy: 'cache-and-network',
  });

  const refresh = [
    { query: DASHBOARD, variables: { date } },
    { query: MY_MEDICATIONS },
  ];

  const [addMutation, { loading: adding }] = useMutation<AddMedicationData>(ADD_MEDICATION, {
    refetchQueries: refresh,
  });
  const [updateMutation, { loading: updating }] = useMutation<UpdateMedicationData>(
    UPDATE_MEDICATION,
    { refetchQueries: refresh },
  );
  const [removeMutation, { loading: removing }] = useMutation<RemoveMedicationData>(
    REMOVE_MEDICATION,
    { refetchQueries: refresh },
  );
  const [markMutation] = useMutation<MarkMedicationTakenData>(MARK_MEDICATION_TAKEN, {
    refetchQueries: refresh,
  });

  const all = data?.myMedications ?? [];
  const logs = data?.myMedicationLogs ?? [];

  const active = useMemo(() => all.filter((m) => m.active), [all]);
  const paused = useMemo(() => all.filter((m) => !m.active), [all]);

  // ids of medications already logged today
  const takenIds = useMemo(
    () => new Set(logs.filter((l) => l.status === 'taken').map((l) => l.medicationId)),
    [logs],
  );

  const dueToday = useMemo(
    () => active.map((m) => ({ ...m, taken: takenIds.has(m.id) })),
    [active, takenIds],
  );

  const dueCount = dueToday.filter((m) => !m.taken).length;

  const add = (input: AddMedicationInput) => addMutation({ variables: { input } });
  const update = (id: string, input: UpdateMedicationInput) =>
    updateMutation({ variables: { id, input } });
  const remove = (id: string) => removeMutation({ variables: { id } });
  const markTaken = (medicationId: string) =>
    markMutation({ variables: { medicationId, status: 'taken' } });

  // pausing keeps the history but stops it appearing in today's list
  const setActive = (id: string, value: boolean) => update(id, { active: value });

  return {
    medications: all,
    active,
    paused,
    dueToday,
    dueCount,
    add,
    update,
    remove,
    setActive,
    markTaken,
    saving: adding || updating,
    removing,
    loading,
    error,
    refetch,
  };
}

export default useMedications;
