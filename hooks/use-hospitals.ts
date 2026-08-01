// hooks/use-hospitals.ts — the facility directory behind "Find care".
//
// Uses hospitals() rather than nearbyHospitals() on purpose: it needs no
// location permission, so the list works the first time it's opened. When she
// grants location we sort by distance on the device instead of re-querying —
// the directory is small, and a second round trip on 2G is worse than the maths.
import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';

import { HOSPITALS, type Hospital, type HospitalsData } from '@/graphql';

// matches the backend enum on hospital.type
export const FACILITY_TYPES = ['hospital', 'clinic', 'pharmacy'] as const;
export type FacilityFilter = (typeof FACILITY_TYPES)[number];

// haversine — same formula the backend uses for nearbyHospitals
export const distanceKm = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function useHospitals(
  city?: string,
  userCoords?: { latitude: number; longitude: number } | null,
) {
  // null = show every kind of facility
  const [filter, setFilter] = useState<FacilityFilter | null>(null);
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = useQuery<HospitalsData>(HOSPITALS, {
    variables: { city, type: filter ?? undefined },
    fetchPolicy: 'cache-and-network',
  });

  const all = data?.hospitals ?? [];

  // name / address search happens on the device — the list is small enough
  // that a round trip per keystroke would be worse on a slow connection
  const facilities = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matched = q
      ? all.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            (h.address ?? '').toLowerCase().includes(q),
        )
      : all;

    if (!userCoords) return matched;

    // closest first — when you need care, "nearest" beats "alphabetical"
    return matched
      .map((h): Hospital => ({ ...h, distanceKm: distanceKm(userCoords, h) }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [all, search, userCoords]);

  return {
    facilities,
    count: facilities.length,
    totalCount: all.length,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    error,
    refetch,
  };
}

export default useHospitals;
