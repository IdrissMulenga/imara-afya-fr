// app/(home)/care.tsx — Find care: hospitals, clinics and pharmacies.
//
// Map + list, toggled. It runs off hospitals(), which needs no location
// permission, so the list works the first time it's opened; location is only
// asked for when she taps "Use my location", and only adds distance sorting.
import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Linking, Alert, Platform,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import useHospitals, { FACILITY_TYPES, type FacilityFilter } from '@/hooks/use-hospitals';
import useLocation from '@/hooks/use-location';
import FacilityMap from '@/components/care/facility-map';
import type { Hospital } from '@/graphql';

// each facility kind gets its own icon so the list is scannable at a glance
const LOOK: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  hospital: { icon: 'medical-outline', tint: '#FEE2E2' },
  clinic: { icon: 'business-outline', tint: '#DBEAFE' },
  pharmacy: { icon: 'bandage-outline', tint: '#DCFCE7' },
};

function FacilityCard({
  facility,
  index,
  onSelect,
}: {
  facility: Hospital;
  index: number;
  onSelect?: () => void;
}) {
  const { c } = useTheme();
  const { t } = useStrings();

  const look = LOOK[facility.type ?? 'hospital'] ?? LOOK.hospital;

  const call = () => {
    if (!facility.phone) {
      Alert.alert(facility.name, t.noPhone);
      return;
    }
    // strip spaces so the dialler always gets a clean number
    Linking.openURL(`tel:${facility.phone.replace(/\s/g, '')}`);
  };

  // hand off to whichever maps app the phone actually has
  const directions = () => {
    const { latitude, longitude, name } = facility;

    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch(() => {
      // no maps app installed — the browser always works
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    });
  };

  return (
    <FadeIn index={index}>
      <PressableScale
        onPress={onSelect}
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.icon, { backgroundColor: look.tint }]}>
            <Ionicons name={look.icon} size={20} color="#0F7A54" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]}>{facility.name}</Text>
            {!!facility.address && (
              <Text style={[styles.address, { color: c.textMuted }]} numberOfLines={2}>
                {facility.address}
              </Text>
            )}
            {facility.distanceKm != null && (
              <Text style={[styles.distance, { color: c.primary }]}>
                {facility.distanceKm.toFixed(1)} {t.kmAway}
              </Text>
            )}
          </View>
        </View>

        {/* calling is the point of this screen — make it the obvious action */}
        <View style={styles.actionRow}>
          <PressableScale
            onPress={call}
            style={[
              styles.callBtn,
              {
                backgroundColor: facility.phone ? c.primary : c.fieldBg,
                borderColor: c.border,
              },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={17}
              color={facility.phone ? '#fff' : c.textFaint}
            />
            <Text
              style={[styles.callText, { color: facility.phone ? '#fff' : c.textFaint }]}
            >
              {facility.phone ?? t.noPhone}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={directions}
            style={[styles.dirBtn, { backgroundColor: c.fieldBg, borderColor: c.border }]}
          >
            <Ionicons name="navigate-outline" size={17} color={c.primary} />
          </PressableScale>
        </View>
      </PressableScale>
    </FadeIn>
  );
}

export default function CareScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  const { coords, request: requestLocation, loading: locating, denied } = useLocation();

  const {
    facilities, region, count, totalCount, filter, setFilter,
    search, setSearch, searching, loading, refetch,
  } = useHospitals(undefined, coords);

  const [showMap, setShowMap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const typeLabel = (value: FacilityFilter) =>
    value === 'hospital' ? t.typeHospital : value === 'clinic' ? t.typeClinic : t.typePharmacy;

  // Search runs on the backend now, so there is a moment after the last
  // keystroke where the on-screen list is stale. Treat that as busy, otherwise
  // it briefly reads as "no results" for something that does match.
  const busy = loading || searching;

  // nothing in the directory at all vs nothing matching the search are very
  // different problems — say which one it is
  const isEmptyDirectory = !busy && totalCount === 0;
  const isEmptySearch = !busy && totalCount > 0 && count === 0;

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style="light" />

      {/* fixed header — stays put while the body scrolls */}
      <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 12 }]}>
        <View style={styles.heroTop}>
          {router.canGoBack() && (
            <PressableScale onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </PressableScale>
          )}
          <Text style={styles.heroTitle}>{t.careTitle}</Text>
        </View>
        <Text style={styles.heroSub}>{t.careSub}</Text>

        {/* search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.75)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchCarePh}
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!search && (
            <PressableScale onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.75)" />
            </PressableScale>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={c.primary} />
        }
      >

        {/* filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <PressableScale
            onPress={() => setFilter(null)}
            style={[
              styles.chip,
              {
                backgroundColor: filter === null ? c.primary : c.surface,
                borderColor: filter === null ? c.primary : c.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: filter === null ? '#fff' : c.textMuted }]}>
              {t.filterAll}
            </Text>
          </PressableScale>

          {FACILITY_TYPES.map((value) => {
            const on = filter === value;
            return (
              <PressableScale
                key={value}
                onPress={() => setFilter(on ? null : value)}
                style={[
                  styles.chip,
                  { backgroundColor: on ? c.primary : c.surface, borderColor: on ? c.primary : c.border },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? '#fff' : c.textMuted }]}>
                  {typeLabel(value)}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        {/* map / list toggle */}
        <View style={styles.toggleRow}>
          <View style={[styles.toggle, { backgroundColor: c.fieldBg }]}>
            <PressableScale
              onPress={() => setShowMap(true)}
              style={[styles.toggleBtn, showMap && { backgroundColor: c.surface }]}
            >
              <Ionicons name="map-outline" size={15} color={showMap ? c.primary : c.textMuted} />
              <Text style={[styles.toggleText, { color: showMap ? c.primary : c.textMuted }]}>
                {t.mapView}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={() => setShowMap(false)}
              style={[styles.toggleBtn, !showMap && { backgroundColor: c.surface }]}
            >
              <Ionicons name="list-outline" size={15} color={!showMap ? c.primary : c.textMuted} />
              <Text style={[styles.toggleText, { color: !showMap ? c.primary : c.textMuted }]}>
                {t.listView}
              </Text>
            </PressableScale>
          </View>

          {/* only ask for location when she asks for it */}
          {!coords && (
            <PressableScale
              onPress={requestLocation}
              disabled={locating}
              style={[styles.locBtn, { borderColor: c.border, backgroundColor: c.surface }]}
            >
              {locating ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Ionicons name="locate-outline" size={17} color={c.primary} />
              )}
            </PressableScale>
          )}
        </View>

        {denied && (
          <View style={[styles.deniedRow, { backgroundColor: c.ring }]}>
            <Ionicons name="information-circle-outline" size={15} color={c.primary} />
            <Text style={[styles.deniedText, { color: c.primary }]}>{t.locationDenied}</Text>
          </View>
        )}

        {showMap && (
          <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
            <FacilityMap
              facilities={facilities}
              region={region}
              userCoords={coords}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </View>
        )}

        <View style={styles.body}>
          {busy && !count ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 32 }} />
          ) : isEmptyDirectory ? (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="map-outline" size={30} color={c.textFaint} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noFacilities}</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noFacilitiesSub}</Text>
            </View>
          ) : isEmptySearch ? (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="search-outline" size={28} color={c.textFaint} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noSearchResults}</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {facilities.map((facility, i) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  index={i}
                  onSelect={() => {
                    setSelectedId(facility.id);
                    setShowMap(true);
                  }}
                />
              ))}
            </View>
          )}

          {/* the app is not an emergency service — be explicit about it */}
          <View style={styles.noteRow}>
            <Ionicons name="alert-circle-outline" size={15} color={c.textFaint} />
            <Text style={[styles.noteText, { color: c.textFaint }]}>{t.emergencyNote}</Text>
          </View>

          {/* REQUIRED. The facility directory is OpenStreetMap data under the
              ODbL licence, which obliges us to credit the source wherever it is
              shown. Left untranslated on purpose — this is the wording the
              licence expects, and it is a credit rather than UI copy. */}
          <Text style={[styles.attribution, { color: c.textFaint }]}>
            Facility data © OpenStreetMap contributors
          </Text>
        </View>
      </ScrollView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  attribution: { fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 14 },
  hero: {
    paddingHorizontal: 22, paddingBottom: 22,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtn: { marginLeft: -6 },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 6 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginTop: 18,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500', padding: 0 },

  filterRow: { paddingHorizontal: 22, paddingTop: 18, gap: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 13.5, fontWeight: '700' },

  body: { paddingHorizontal: 22, paddingTop: 20 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 22, paddingTop: 16,
  },
  toggle: { flex: 1, flexDirection: 'row', padding: 3, borderRadius: 12, gap: 3 },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 10,
  },
  toggleText: { fontSize: 13, fontWeight: '700' },
  locBtn: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  deniedRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    marginHorizontal: 22, marginTop: 12, padding: 12, borderRadius: 12,
  },
  deniedText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  distance: { fontSize: 12.5, fontWeight: '800', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  dirBtn: {
    width: 46, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  cardTop: { flexDirection: 'row', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  address: { fontSize: 13, fontWeight: '500', marginTop: 3, lineHeight: 18 },

  callBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 13, paddingVertical: 12, borderWidth: 1,
  },
  callText: { fontSize: 14.5, fontWeight: '700' },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 40, paddingHorizontal: 26, borderWidth: 1, borderRadius: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  emptyText: { fontSize: 13.5, fontWeight: '500', textAlign: 'center', lineHeight: 19 },

  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 22 },
  noteText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },
});
