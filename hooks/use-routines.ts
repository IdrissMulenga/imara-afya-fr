// hooks/use-routines.ts — the things you decided to do every day.
//
// Two lists, deliberately kept apart:
//
//   • `due`     — what is actually due TODAY, with tick state and streaks.
//                 This is the list the user works through.
//   • `all`     — every routine including archived ones, for managing them.
//
// A routine that only runs on weekdays is not "missing" on a Sunday, it just
// isn't due — so the daily list has to be filtered by the backend rather than
// showing everything with most of it greyed out.
import { useMutation, useQuery } from '@apollo/client/react';

import {
  ADD_ROUTINE,
  MY_ROUTINES,
  REMOVE_ROUTINE,
  SET_ROUTINE_DONE,
  TODAY_ROUTINES,
  UPDATE_ROUTINE,
  type AddRoutineData,
  type MyRoutinesData,
  type RemoveRoutineData,
  type RoutineInput,
  type SetRoutineDoneData,
  type TodayRoutinesData,
  type UpdateRoutineData,
  type UpdateRoutineInput,
} from '@/graphql';
import { todayIso } from '@/lib/dates';

export function useRoutines() {
  const date = todayIso();

  const { data, loading, error, refetch } = useQuery<TodayRoutinesData>(TODAY_ROUTINES, {
    variables: { date },
    fetchPolicy: 'cache-and-network',
  });

  const { data: allData } = useQuery<MyRoutinesData>(MY_ROUTINES, {
    variables: { includeArchived: true },
    fetchPolicy: 'cache-and-network',
  });

  // Both lists refresh together: adding a routine changes what's due today,
  // and ticking one changes nothing in the manage list but costs little.
  const refresh = [
    { query: TODAY_ROUTINES, variables: { date } },
    { query: MY_ROUTINES, variables: { includeArchived: true } },
  ];

  const [addMutation, { loading: adding }] = useMutation<AddRoutineData>(ADD_ROUTINE, {
    refetchQueries: refresh,
  });
  const [updateMutation, { loading: updating }] = useMutation<UpdateRoutineData>(UPDATE_ROUTINE, {
    refetchQueries: refresh,
  });
  const [removeMutation, { loading: removing }] = useMutation<RemoveRoutineData>(REMOVE_ROUTINE, {
    refetchQueries: refresh,
  });
  const [doneMutation] = useMutation<SetRoutineDoneData>(SET_ROUTINE_DONE, {
    refetchQueries: refresh,
  });

  const today = data?.todayRoutines ?? null;

  const add = (input: RoutineInput) => addMutation({ variables: { input } });
  const update = (id: string, input: UpdateRoutineInput) =>
    updateMutation({ variables: { id, input } });
  const remove = (id: string) => removeMutation({ variables: { id } });

  // Archiving rather than deleting keeps the history behind a routine someone
  // has simply stopped doing for now.
  const setActive = (id: string, active: boolean) => update(id, { active });

  const setDone = (id: string, done: boolean) =>
    doneMutation({ variables: { id, done, date } });

  return {
    date,
    due: today?.routines ?? [],
    doneCount: today?.doneCount ?? 0,
    dueCount: today?.dueCount ?? 0,
    // everything, for the manage list
    all: allData?.myRoutines ?? [],
    add,
    update,
    remove,
    setActive,
    setDone,
    saving: adding || updating,
    removing,
    loading,
    error,
    refetch,
  };
}

export default useRoutines;
