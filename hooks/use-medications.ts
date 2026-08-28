// hooks/use-medications.ts — medication list, today's doses, add / edit / remove.
//
//   const { medications, dueToday, add, markTaken } = useMedications();
import { useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  ADD_MEDICATION,
  DASHBOARD,
  MEDICATION_ADHERENCE,
  type MedicationAdherenceData,
  MARK_MEDICATION_TAKEN,
  MY_MEDICATIONS,
  REMOVE_MEDICATION,
  UPDATE_MEDICATION,
  type AddMedicationData,
  type AddMedicationInput,
  type DashboardData,
  type MarkMedicationTakenData,
  UNMARK_MEDICATION_TAKEN,
  type UnmarkMedicationTakenData,
  type RemoveMedicationData,
  type UpdateMedicationData,
  type UpdateMedicationInput,
} from '@/graphql';
import { buildDueDoses, outstandingCount, takenCountOf } from '@/lib/doses';
import { addDaysIso, todayIso } from '@/lib/dates';

export function useMedications() {
  // Both from lib/dates, which builds the date from local year/month/day.
  // A local `new Date().toISOString().slice(0, 10)` used to live here and gave
  // the UTC day — so between midnight and 02:00 in Bujumbura this screen asked
  // for yesterday's doses.
  const date = todayIso();
  const weekAgo = addDaysIso(date, -6);

  // the dashboard query already returns medications + today's logs together,
  // so reuse it here instead of firing two more round trips
  //
  // VARIABLES MUST MATCH use-dashboard EXACTLY. Apollo keys the cache on query
  // + variables, so passing only { date } here made this a second, separate
  // cache entry — an extra round trip, and worse, the refetch below then
  // refreshed an entry the dashboard wasn't reading. Ticking a dose here left
  // the dashboard showing stale counts until it happened to refetch itself.
  const { data, loading, error, refetch } = useQuery<DashboardData>(DASHBOARD, {
    variables: { date, weekAgo },
    fetchPolicy: 'cache-and-network',
  });

  const refresh = [
    { query: DASHBOARD, variables: { date, weekAgo } },
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
  const [unmarkMutation] = useMutation<UnmarkMedicationTakenData>(UNMARK_MEDICATION_TAKEN, {
    refetchQueries: refresh,
  });

  const all = data?.myMedications ?? [];
  const logs = data?.myMedicationLogs ?? [];

  const active = useMemo(() => all.filter((m) => m.active), [all]);
  const paused = useMemo(() => all.filter((m) => !m.active), [all]);

  // ONE ENTRY PER SCHEDULED TIME, not per medicine. A twice-daily medicine is
  // two independent doses; ticking breakfast must not tick the evening.
  const dueToday = useMemo(() => buildDueDoses(active, logs), [active, logs]);

  const dueCount = outstandingCount(dueToday);
  const takenCount = takenCountOf(dueToday);

  const add = (input: AddMedicationInput) => addMutation({ variables: { input } });
  const update = (id: string, input: UpdateMedicationInput) =>
    updateMutation({ variables: { id, input } });
  const remove = (id: string) => removeMutation({ variables: { id } });
  // `slot` is which of the day's doses — omit it only for as-needed medicines
  const markTaken = (medicationId: string, slot?: string | null) =>
    markMutation({ variables: { medicationId, slot: slot ?? undefined, status: 'taken' } });

  const unmarkTaken = (medicationId: string, slot?: string | null) =>
    unmarkMutation({ variables: { medicationId, slot: slot ?? undefined } });

  // pausing keeps the history but stops it appearing in today's list
  const setActive = (id: string, value: boolean) => update(id, { active: value });

  // ADHERENCE IS ITS OWN REQUEST, not folded into the medicines query.
  //
  // It scans a month of dose history per medicine, and the list screen has to
  // render before that finishes — a user opening Medicines should see their
  // medicines immediately, not wait on a statistic they didn't ask for.
  const { data: adherenceData } = useQuery<MedicationAdherenceData>(MEDICATION_ADHERENCE, {
    variables: { days: 30 },
    fetchPolicy: 'cache-and-network',
  });

  return {
    adherence: adherenceData?.medicationAdherence ?? null,
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
    unmarkTaken,
    takenCount,
    saving: adding || updating,
    removing,
    loading,
    error,
    refetch,
  };
}

export default useMedications;
