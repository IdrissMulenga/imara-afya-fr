// components/care/facility-map.tsx — hospitals, clinics and pharmacies on a map.
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import type { Hospital } from '@/graphql';

// Bujumbura city centre — where the map opens when we have no user location
// and no facilities to frame.
const BUJUMBURA: Region = {
  latitude: -3.3822,
  longitude: 29.3644,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

const PIN_COLOR: Record<string, string> = {
  hospital: '#DC2626',
  clinic: '#2563EB',
  pharmacy: '#0F7A54',
};

// smallest box that contains every point, with breathing room
const regionFor = (points: { latitude: number; longitude: number }[]): Region => {
  if (!points.length) return BUJUMBURA;

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    // a single pin would give a delta of 0 and zoom to the atom, so floor it
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
  };
};

export default function FacilityMap({
  facilities,
  userCoords,
  selectedId,
  onSelect,
  height = 280,
}: {
  facilities: Hospital[];
  userCoords?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const { c } = useTheme();
  const { t } = useStrings();

  const mapRef = useRef<MapView>(null);

  // re-frame when the filtered list changes, so the map follows the search
  useEffect(() => {
    const points = [...facilities];

    if (userCoords) points.push({ ...userCoords } as Hospital);

    if (!points.length) return;

    mapRef.current?.animateToRegion(regionFor(points), 500);
  }, [facilities, userCoords]);

  // centre on a facility when its card is tapped in the list
  useEffect(() => {
    if (!selectedId) return;

    const target = facilities.find((f) => f.id === selectedId);

    if (!target) return;

    mapRef.current?.animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  }, [selectedId, facilities]);

  return (
    <View style={[styles.wrap, { height, borderColor: c.border }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Google on Android is the reliable choice; iOS uses Apple Maps, which
        // needs no key and works out of the box
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={regionFor(facilities)}
        showsUserLocation={!!userCoords}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        {facilities.map((facility) => (
          <Marker
            key={facility.id}
            coordinate={{ latitude: facility.latitude, longitude: facility.longitude }}
            title={facility.name}
            description={facility.address ?? undefined}
            pinColor={PIN_COLOR[facility.type ?? 'hospital'] ?? PIN_COLOR.hospital}
            onPress={() => onSelect?.(facility.id)}
          />
        ))}
      </MapView>

      {/* an empty map looks broken — say why it's empty */}
      {!facilities.length && (
        <View style={[styles.overlay, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="location-outline" size={17} color={c.textFaint} />
          <Text style={[styles.overlayText, { color: c.textMuted }]}>{t.noFacilities}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  overlay: {
    position: 'absolute', left: 16, right: 16, top: '42%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1,
  },
  overlayText: { fontSize: 13, fontWeight: '600' },
});
