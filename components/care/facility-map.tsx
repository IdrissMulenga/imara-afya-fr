// components/care/facility-map.tsx — hospitals, clinics and pharmacies on a map.
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import type { Hospital, MapRegion } from '@/graphql';

// Where the map opens is decided by the backend (careMap.region), which frames
// the pins and the user's position together. This is only the stand-in for the
// first render, before the first response lands — deliberately wide, so it
// never looks like a confident wrong answer.
const FALLBACK: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 90,
  longitudeDelta: 90,
};

const PIN_COLOR: Record<string, string> = {
  hospital: '#DC2626',
  clinic: '#2563EB',
  pharmacy: '#0F7A54',
};

// WHICH MAP TO DRAW WITH.
//
// Google on both platforms, so the map looks and behaves the same everywhere
// and there is only one set of behaviour to test and support.
//
// Both platforms need their own key for that (see app.config.js). If the iOS
// key is missing we fall back to Apple Maps rather than render the grey
// rectangle that asking for Google without a key produces — a different-looking
// map beats no map at all on a screen whose job is finding a clinic. The
// warning below is so that fallback is never silent.
//
// `undefined` means "platform default", which on iOS is Apple Maps.
const iosGoogleKey = (Constants.expoConfig?.ios?.config as { googleMapsApiKey?: string } | undefined)
  ?.googleMapsApiKey;

const MAP_PROVIDER = Platform.OS === 'ios' && !iosGoogleKey ? undefined : PROVIDER_GOOGLE;

if (__DEV__ && Platform.OS === 'ios' && !iosGoogleKey) {
  console.warn(
    '[imara-afya] No iOS Google Maps key — falling back to Apple Maps. '
    + 'Set GOOGLE_MAPS_IOS_API_KEY to use Google on iOS.',
  );
}

export default function FacilityMap({
  facilities,
  region,
  userCoords,
  selectedId,
  onSelect,
  height = 280,
}: {
  facilities: Hospital[];
  // null only until the first response arrives
  region?: MapRegion | null;
  userCoords?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const { c } = useTheme();
  const { t } = useStrings();

  const mapRef = useRef<MapView>(null);

  // Follow the backend's framing as the filter and search change.
  //
  // Keyed on the four numbers rather than the object: every response is a new
  // object, so using it directly would re-animate the map on each poll even
  // when the region hasn't actually moved.
  useEffect(() => {
    if (!region) return;

    mapRef.current?.animateToRegion(region, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    region?.latitude,
    region?.longitude,
    region?.latitudeDelta,
    region?.longitudeDelta,
  ]);

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
        // resolved once at module load — see MAP_PROVIDER above
        provider={MAP_PROVIDER}
        initialRegion={region ?? FALLBACK}
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
