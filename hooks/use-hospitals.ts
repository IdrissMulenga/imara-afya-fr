// hooks/use-hospitals.ts — the facility directory behind "Find care".
//
// Everything comes from careMap(), a single backend query that filters,
// searches, measures distances, sorts and returns the region the map should
// open at. The app used to run the haversine formula and frame the map itself;
// it no longer knows any geography at all.
//
// Location stays optional. Without it the list is alphabetical, which is why
// the screen works the first time it's opened, before any permission dialog.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@apollo/client/react';

import { CARE_MAP, type CareMapData, type CareMapVars } from '@/graphql';

// matches the backend enum on hospital.type
export const FACILITY_TYPES = ['hospital', 'clinic', 'pharmacy'] as const;
export type FacilityFilter = (typeof FACILITY_TYPES)[number];

// Search now costs a round trip, so wait for a pause in typing. On a 2G
// connection a request per keystroke is both slow and a good way to spend the
// backend's per-operation budget for nothing.
const SEARCH_DEBOUNCE_MS = 350;

export function useHospitals(
  city?: string,
  userCoords?: { latitude: number; longitude: number } | null,
) {
  // null = show every kind of facility
  const [filter, setFilter] = useState<FacilityFilter | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const input = useMemo(
    () => ({
      city,
      type: filter ?? undefined,
      search: debouncedSearch || undefined,
      latitude: userCoords?.latitude,
      longitude: userCoords?.longitude,
    }),
    [city, filter, debouncedSearch, userCoords?.latitude, userCoords?.longitude],
  );

  const { data, previousData, loading, error, refetch } = useQuery<CareMapData, CareMapVars>(
    CARE_MAP,
    { variables: { input }, fetchPolicy: 'cache-and-network' },
  );

  // While a new filter is in flight `data` is briefly undefined. Falling back
  // to the last result keeps the list and the map on screen instead of
  // flashing an empty state on every tap.
  const result = data?.careMap ?? previousData?.careMap ?? null;

  // Hold the last region we were given so the map has something to open at
  // during that same gap — handing MapView nothing resets it to the middle of
  // the Atlantic.
  const lastRegion = useRef(result?.region ?? null);

  if (result?.region) lastRegion.current = result.region;

  return {
    facilities: result?.facilities ?? [],
    region: result?.region ?? lastRegion.current,
    count: result?.count ?? 0,
    totalCount: result?.totalCount ?? 0,
    // true once distances are real, so the UI knows whether to show them
    sortedByDistance: result?.sortedByDistance ?? false,
    filter,
    setFilter,
    search,
    setSearch,
    // the field is still settling — lets the UI stay busy through the debounce
    // rather than only while the request itself is in flight
    searching: search.trim() !== debouncedSearch,
    loading,
    error,
    refetch,
  };
}

export default useHospitals;
