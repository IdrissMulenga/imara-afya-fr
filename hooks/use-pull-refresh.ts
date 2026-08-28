// hooks/use-pull-refresh.ts — the spinner belongs to the USER, not to the query.
//
// THE BUG THIS EXISTS TO FIX.
//
// Every screen was passing Apollo's `loading` straight into RefreshControl:
//
//     <RefreshControl refreshing={loading} onRefresh={() => refetch()} />
//
// Every one of those queries is `cache-and-network`, which means it goes to the
// server again every time the screen mounts. Switch to Health records, switch
// away, switch back — `loading` flips true, and RefreshControl responds by
// yanking the list down and spinning, exactly as though a finger had pulled it.
// Nobody pulled anything. It looked like a glitch on every tab change, and on a
// slow connection it hung there for seconds.
//
// `loading` answers "is a request in flight", which is not the question
// RefreshControl asks. It asks "did the user just pull down". So this tracks
// that, and nothing else — a background refetch now updates the list silently,
// which is what a background refetch is for.
import { useCallback, useState } from 'react';

export function usePullRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Settle either way. A refetch that rejects — offline, expired token — must
    // still stop the spinner; one that turns forever is a worse bug than the
    // one being fixed, because the only way out of it is closing the app.
    Promise.resolve(refetch())
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [refetch]);

  return { refreshing, onRefresh };
}

export default usePullRefresh;
