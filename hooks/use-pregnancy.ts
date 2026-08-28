// hooks/use-pregnancy.ts — the pregnancy tracker.
//
// WOMEN ONLY. The backend rejects every one of these with WOMEN_ONLY for other
// users, so the caller must skip the queries rather than let them error — an
// error toast on a screen someone can't use is worse than no screen at all.
import { useMutation, useQuery } from '@apollo/client/react';

import {
  END_PREGNANCY,
  MY_PREGNANCIES,
  PREGNANCY_PROGRESS,
  REMOVE_PREGNANCY,
  START_PREGNANCY,
  UPDATE_PREGNANCY,
  type EndPregnancyData,
  type EndPregnancyInput,
  type MyPregnanciesData,
  type PregnancyProgressData,
  type RemovePregnancyData,
  type StartPregnancyData,
  type StartPregnancyInput,
  type UpdatePregnancyData,
  type UpdatePregnancyInput,
} from '@/graphql';
import useMe from '@/hooks/use-me';

export function usePregnancy() {
  const { me, loading: loadingMe } = useMe();

  const isWoman = me?.gender === 'Woman';

  const { data, loading, error, refetch } = useQuery<PregnancyProgressData>(PREGNANCY_PROGRESS, {
    skip: !isWoman,
    fetchPolicy: 'cache-and-network',
  });

  const { data: listData } = useQuery<MyPregnanciesData>(MY_PREGNANCIES, {
    skip: !isWoman,
    fetchPolicy: 'cache-and-network',
  });

  const refresh = [{ query: PREGNANCY_PROGRESS }, { query: MY_PREGNANCIES }];

  const [startMutation, { loading: starting }] = useMutation<StartPregnancyData>(START_PREGNANCY, {
    refetchQueries: refresh,
  });
  const [updateMutation, { loading: updating }] = useMutation<UpdatePregnancyData>(
    UPDATE_PREGNANCY,
    { refetchQueries: refresh },
  );
  const [endMutation, { loading: ending }] = useMutation<EndPregnancyData>(END_PREGNANCY, {
    refetchQueries: refresh,
  });
  const [removeMutation, { loading: removing }] = useMutation<RemovePregnancyData>(
    REMOVE_PREGNANCY,
    { refetchQueries: refresh },
  );

  const progress = data?.pregnancyProgress ?? null;
  const all = listData?.myPregnancies ?? [];

  const start = (input: StartPregnancyInput) => startMutation({ variables: { input } });
  const update = (id: string, input: UpdatePregnancyInput) =>
    updateMutation({ variables: { id, input } });
  const end = (id: string, input: EndPregnancyInput) => endMutation({ variables: { id, input } });
  const remove = (id: string) => removeMutation({ variables: { id } });

  return {
    isWoman,
    progress,
    // the one in progress, if any
    current: progress?.active ? progress.pregnancy ?? null : null,
    // everything that has ended, newest first — the backend already sorts
    past: all.filter((p) => p.endedAt),
    start,
    update,
    end,
    remove,
    saving: starting || updating || ending,
    removing,
    loading: loadingMe || loading,
    error,
    refetch,
  };
}

export default usePregnancy;
