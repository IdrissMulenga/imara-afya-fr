// hooks/use-location.ts — the user's coordinates, asked for politely.
//
// Location is optional everywhere it's used. Find care works fine without it —
// it just can't sort by distance. Nothing here blocks the screen, and we never
// ask on mount: the permission dialog is only worth showing after she has
// tapped something that clearly needs it.
import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  // "denied" is a normal outcome, not an error — the UI should say so calmly
  const [denied, setDenied] = useState(false);

  const request = useCallback(async () => {
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setDenied(true);
        return null;
      }

      setDenied(false);

      // Balanced accuracy is plenty for "which clinic is closest" and is much
      // faster and kinder to the battery than High on an entry-level phone.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCoords(next);

      return next;
    } catch {
      // GPS off, indoors with no fix, airplane mode — all the same to the user
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, request, loading, denied };
}

export default useLocation;
