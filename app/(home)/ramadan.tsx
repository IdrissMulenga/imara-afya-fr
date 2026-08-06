// app/(home)/ramadan.tsx — Ramadan mode.
// Backed by ramadanSchedule / setRamadanMode.
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput, Switch,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { FadeIn, PressableScale } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import { useStrings } from '@/constants/strings';
import useRamadan from '@/hooks/use-ramadan';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// "04:30" -> 270, so the two times can be compared
const toMinutes = (time: string) => {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
};

export default function RamadanScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { schedule, save, saving, loading, refetch } = useRamadan();

  const [enabled, setEnabled] = useState(false);
  const [suhoor, setSuhoor] = useState('');
  const [iftar, setIftar] = useState('');

  // Seed the form once. `schedule` is a fresh object on every refetch, so
  // without this guard typing a suhoor time could be wiped the moment any
  // background query resolved.
  const seeded = useRef(false);

  useEffect(() => {
    if (!schedule || seeded.current) return;

    seeded.current = true;

    setEnabled(schedule.enabled);
    setSuhoor(schedule.suhoorTime ?? '');
    setIftar(schedule.iftarTime ?? '');
  }, [schedule]);

  const onSave = async (nextEnabled: boolean) => {
    // turning it on without both times would save a mode that can't do anything
    if (nextEnabled) {
      if (!suhoor.trim() || !iftar.trim()) {
        toast.error(t.errTimesNeeded);
        return;
      }
      if (!TIME_RE.test(suhoor) || !TIME_RE.test(iftar)) {
        toast.error(t.errTimeFormat);
        return;
      }
      if (toMinutes(suhoor) >= toMinutes(iftar)) {
        toast.error(t.errSuhoorOrder);
        return;
      }
    }

    try {
      await save({
        enabled: nextEnabled,
        suhoorTime: suhoor.trim() || undefined,
        iftarTime: iftar.trim() || undefined,
      });
      setEnabled(nextEnabled);
      toast.success(t.ramadanSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
      // put the switch back where it was
      setEnabled(schedule?.enabled ?? false);
    }
  };

  const medications = schedule?.medications ?? [];
  const shifted = medications.filter(
    (m) => m.adjustedTimes.join(',') !== m.originalTimes.join(','),
  );

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style="light" />

      {/* fixed header — stays put while the body scrolls */}
      <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 12 }]}>
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.heroTitle}>{t.ramadanTitle}</Text>
        </View>
        <Text style={styles.heroSub}>{t.ramadanSub}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={c.primary} />
        }
      >

        {loading && !schedule ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.body}>
            {/* ---------------- on / off ---------------- */}
            <FadeIn index={0} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: c.text }]}>
                    {enabled ? t.ramadanOn : t.ramadanOff}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={onSave}
                  disabled={saving}
                  trackColor={{ true: c.primary, false: c.borderStrong }}
                  thumbColor="#fff"
                />
              </View>
            </FadeIn>

            {/* ---------------- fasting window ---------------- */}
            <FadeIn index={1} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.timesRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: c.textMuted }]}>{t.suhoorLabel}</Text>
                  <TextInput
                    value={suhoor}
                    onChangeText={setSuhoor}
                    placeholder={t.timePh}
                    placeholderTextColor={c.textFaint}
                    keyboardType="numbers-and-punctuation"
                    style={[styles.input, { backgroundColor: c.fieldBg, borderColor: c.border, color: c.text }]}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: c.textMuted }]}>{t.iftarLabel}</Text>
                  <TextInput
                    value={iftar}
                    onChangeText={setIftar}
                    placeholder="18:15"
                    placeholderTextColor={c.textFaint}
                    keyboardType="numbers-and-punctuation"
                    style={[styles.input, { backgroundColor: c.fieldBg, borderColor: c.border, color: c.text }]}
                  />
                </View>
              </View>

              <PressableScale
                onPress={() => onSave(enabled)}
                disabled={saving}
                style={[styles.action, { backgroundColor: c.primary }]}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>{t.save}</Text>}
              </PressableScale>
            </FadeIn>

            {/* ---------------- adjusted dose times ---------------- */}
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.adjustedTitle}</Text>

            {!medications.length ? (
              <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="medkit-outline" size={26} color={c.textFaint} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noMedsForRamadan}</Text>
              </View>
            ) : !shifted.length ? (
              <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="checkmark-circle-outline" size={26} color={c.textFaint} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noShift}</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {shifted.map((m, i) => (
                  <FadeIn
                    key={m.id}
                    index={i + 2}
                    style={[styles.medCard, { backgroundColor: c.surface, borderColor: c.border }]}
                  >
                    <Text style={[styles.medName, { color: c.text }]}>{m.name}</Text>

                    <View style={styles.timeCompare}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.timeLabel, { color: c.textFaint }]}>{t.originalLabel}</Text>
                        <Text style={[styles.timeOld, { color: c.textMuted }]}>
                          {m.originalTimes.join(' · ') || '—'}
                        </Text>
                      </View>

                      <Ionicons name="arrow-forward" size={16} color={c.textFaint} />

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.timeLabel, { color: c.textFaint }]}>{t.adjustedLabel}</Text>
                        <Text style={[styles.timeNew, { color: c.primary }]}>
                          {m.adjustedTimes.join(' · ') || '—'}
                        </Text>
                      </View>
                    </View>
                  </FadeIn>
                ))}
              </View>
            )}

            {/* moving medicine times is a clinical decision, not an app decision */}
            <View style={[styles.disclaimer, { backgroundColor: c.dangerRing }]}>
              <Ionicons name="warning-outline" size={17} color={c.danger} />
              <Text style={[styles.disclaimerText, { color: c.danger }]}>
                {t.ramadanDisclaimer}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 8 },

  body: { paddingHorizontal: 22, paddingTop: 22, gap: 14 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
  cardTitle: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  timesRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontWeight: '700', letterSpacing: 0.5,
  },
  action: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14, marginTop: 16,
  },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: 12, marginBottom: 2,
  },
  medCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  medName: { fontSize: 15.5, fontWeight: '700' },
  timeCompare: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  timeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeOld: { fontSize: 14.5, fontWeight: '600', marginTop: 3, textDecorationLine: 'line-through' },
  timeNew: { fontSize: 14.5, fontWeight: '800', marginTop: 3 },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 30, paddingHorizontal: 24, borderWidth: 1, borderRadius: 20,
  },
  emptyText: { fontSize: 13.5, fontWeight: '600', textAlign: 'center' },

  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 14, borderRadius: 16, marginTop: 6,
  },
  disclaimerText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
});
