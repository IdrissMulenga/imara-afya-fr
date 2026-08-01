// hooks/use-me.ts — the signed-in user. Reusable read-only hook.
//
//   const { me, loading, refetch } = useMe();
import { useQuery } from '@apollo/client/react';

import { ME, type MeData } from '@/graphql';

export function useMe(options?: { skip?: boolean }) {
  const { data, loading, error, refetch } = useQuery<MeData>(ME, {
    skip: options?.skip,
    fetchPolicy: 'cache-and-network',
  });

  return { me: data?.me ?? null, loading, error, refetch };
}

export default useMe;
