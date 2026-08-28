// hooks/use-check-in.ts — how are you today.
//
// One entry per day. Saving again on the same date EDITS that entry rather than
// creating a second one, which is why there is no separate "update" here — the
// backend upserts and the unique index enforces it.
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CHECK_IN_SUMMARY,
  MY_CHECK_INS,
  REMOVE_CHECK_IN,
  SAVE_CHECK_IN,
  type CheckInInput,
  type CheckInSummaryData,
  type MyCheckInsData,
  type RemoveCheckInData,
  type SaveCheckInData,
} from '@/graphql';
import { addDaysIso, todayIso } from '@/lib/dates';

// Two weeks of history on the screen. Long enough to see a pattern, short
// enough to stay readable on a small phone.
const HISTORY_DAYS = 14;

// The window the averages are computed over.
const WINDOW_DAYS = 30;

export function useCheckIn() {
  const today = todayIso();
  const from = addDaysIso(today, -(HISTORY_DAYS - 1));

  const { data, loading, error, refetch } = useQuery<CheckInSummaryData>(CHECK_IN_SUMMARY, {
    variables: { days: WINDOW_DAYS },
    fetchPolicy: 'cache-and-network',
  });

  const { data: historyData } = useQuery<MyCheckInsData>(MY_CHECK_INS, {
    variables: { from, to: today },
    fetchPolicy: 'cache-and-network',
  });

  const refresh = [
    { query: CHECK_IN_SUMMARY, variables: { days: WINDOW_DAYS } },
    { query: MY_CHECK_INS, variables: { from, to: today } },
  ];

  const [saveMutation, { loading: saving }] = useMutation<SaveCheckInData>(SAVE_CHECK_IN, {
    refetchQueries: refresh,
  });
  const [removeMutation, { loading: removing }] = useMutation<RemoveCheckInData>(REMOVE_CHECK_IN, {
    refetchQueries: refresh,
  });

  const summary = data?.checkInSummary ?? null;

  const save = (input: CheckInInput) => saveMutation({ variables: { input } });
  const remove = (date: string) => removeMutation({ variables: { date } });

  return {
    today,
    // null until she has checked in today — the screen uses this to decide
    // between "how are you?" and "you said this earlier, change it?"
    entry: summary?.today ?? null,
    streak: summary?.streak ?? 0,
    averageMood: summary?.averageMood ?? null,
    averageEnergy: summary?.averageEnergy ?? null,
    loggedDays: summary?.loggedDays ?? 0,
    windowDays: summary?.windowDays ?? WINDOW_DAYS,
    history: historyData?.myCheckIns ?? [],
    historyDays: HISTORY_DAYS,
    save,
    remove,
    saving,
    removing,
    loading,
    error,
    refetch,
  };
}

export default useCheckIn;
