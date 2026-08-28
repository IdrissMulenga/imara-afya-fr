
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import usePullRefresh from '@/hooks/use-pull-refresh';
import HeroBackdrop, { HERO_TOP_GAP, HERO_BOTTOM_GAP } from '@/components/hero-backdrop';
import { useTabBarInset } from '@/components/glass-surface';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import useCheckIn from '@/hooks/use-check-in';

// 1..5, worst to best
const MOOD_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'sad-outline', 'sad-outline', 'happy-outline', 'happy-outline', 'happy-outline',
];

const SCALE_COLORS = ['#DC2626', '#EA580C', '#CA8A04', '#65A30D', '#0F7A54'];

export default function CheckInScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const {
    entry, streak, averageMood, averageEnergy, loggedDays, windowDays,
    history, save, saving, loading, refetch,
  } = useCheckIn();

  // the spinner shows for a pull, not for every background refetch
  const { refreshing, onRefresh } = usePullRefresh(refetch);

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');


  const prefilled = useRef(false);

  useEffect(() => {
    if (!entry || prefilled.current) return;

    prefilled.current = true;

    setMood(entry.mood);
    setEnergy(entry.energy);
    setNote(entry.note ?? '');
  }, [entry]);

  const moodLabels = [t.mood1, t.mood2, t.mood3, t.mood4, t.mood5];
  const energyLabels = [t.energy1, t.energy2, t.energy3, t.energy4, t.energy5];

  const submit = async () => {
    try {
      await save({ mood, energy, note: note.trim() || undefined });
      toast.success(t.checkInSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  const Scale = ({
    value,
    onChange,
    labels,
    icons,
  }: {
    value: number;
    onChange: (n: number) => void;
    labels: string[];
    icons?: (keyof typeof Ionicons.glyphMap)[];
  }) => (
    <>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === n;

          return (
            <PressableScale
              key={n}
              onPress={() => onChange(n)}
              style={[
                styles.scaleItem,
                {
                  backgroundColor: on ? SCALE_COLORS[n - 1] : c.fieldBg,
                  borderColor: on ? SCALE_COLORS[n - 1] : c.border,
                },
              ]}
            >
              {icons ? (
                <Ionicons name={icons[n - 1]} size={22} color={on ? '#fff' : c.textFaint} />
              ) : (
                <Text style={[styles.scaleNum, { color: on ? '#fff' : c.textMuted }]}>{n}</Text>
              )}
            </PressableScale>
          );
        })}
      </View>

      {/* the word, not the number — it's what makes the choice unambiguous */}
      <Text style={[styles.scaleLabel, { color: c.textMuted }]}>{labels[value - 1]}</Text>
    </>
  );

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <HeroBackdrop style={[styles.hero, { paddingTop: insets.top + HERO_TOP_GAP }]}>
        <View style={styles.heroTop}>
          <PressableScale
            onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(home)'); }}
            hitSlop={10}
            style={{ marginLeft: -6 }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </PressableScale>
          <Text style={styles.heroTitle}>{t.checkInTitle}</Text>
        </View>

        {/* the question changes once she has already answered today */}
        <Text style={styles.heroSub}>{entry ? t.checkInToday : t.checkInSub}</Text>

        {streak > 1 && (
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={14} color="#fff" />
            <Text style={styles.streakText}>{streak} {t.dayStreak}</Text>
          </View>
        )}
      </HeroBackdrop>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 + tabBarInset }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >
        <View style={styles.body}>
          <FadeIn index={0} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t.moodLabel}</Text>
            <Scale value={mood} onChange={setMood} labels={moodLabels} icons={MOOD_ICONS} />
          </FadeIn>

          <FadeIn index={1} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t.energyLabel}</Text>
            <Scale value={energy} onChange={setEnergy} labels={energyLabels} />
          </FadeIn>

          <FadeIn index={2} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t.checkInNote}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.checkInNotePh}
              placeholderTextColor={c.textFaint}
              multiline
              maxLength={500}
              style={[styles.noteInput, { backgroundColor: c.fieldBg, borderColor: c.border, color: c.text }]}
            />
          </FadeIn>

          <PressableScale
            onPress={submit}
            disabled={saving}
            style={[styles.primary, { backgroundColor: c.primary }]}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryText}>{entry ? t.checkInEdit : t.save}</Text>}
          </PressableScale>

          {/* -------------------- averages -------------------- */}
          {loggedDays > 0 && (
            <FadeIn index={3} style={styles.statRow}>
              <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {averageMood?.toFixed(1) ?? '—'}
                </Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>{t.avgMood}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {averageEnergy?.toFixed(1) ?? '—'}
                </Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>{t.avgEnergy}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {loggedDays}<Text style={[styles.statOf, { color: c.textFaint }]}>/{windowDays}</Text>
                </Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>{t.lastDays}</Text>
              </View>
            </FadeIn>
          )}

          {/* -------------------- history -------------------- */}
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.lastDays}</Text>

          {!history.length ? (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="calendar-outline" size={26} color={c.textFaint} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noCheckIns}</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {history.map((item, i) => (
                <FadeIn key={item.id} index={i + 4}>
                  <View style={[styles.historyRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <View style={[styles.dot, { backgroundColor: SCALE_COLORS[item.mood - 1] }]} />

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyDate, { color: c.text }]}>{item.date}</Text>
                      {!!item.note && (
                        <Text style={[styles.historyNote, { color: c.textMuted }]} numberOfLines={1}>
                          {item.note}
                        </Text>
                      )}
                    </View>

                    <Text style={[styles.historyScore, { color: c.textMuted }]}>
                      {moodLabels[item.mood - 1]}
                    </Text>
                  </View>
                </FadeIn>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 22, paddingBottom: HERO_BOTTOM_GAP },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 8 },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 11, marginTop: 14,
  },
  streakText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },

  body: { paddingHorizontal: 22, paddingTop: 20, gap: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
  cardTitle: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },

  scaleRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  scaleItem: {
    flex: 1, borderWidth: 1, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  scaleNum: { fontSize: 16, fontWeight: '800' },
  scaleLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 10 },

  noteInput: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14.5, fontWeight: '500', minHeight: 76, textAlignVertical: 'top', marginTop: 12,
  },

  primary: {
    borderRadius: 16, paddingVertical: 16, marginTop: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  statRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  statCard: {
    flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statOf: { fontSize: 13, fontWeight: '700' },
  statLabel: { fontSize: 11.5, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: 18, marginBottom: 2,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 13, borderWidth: 1, borderRadius: 14,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  historyDate: { fontSize: 14, fontWeight: '700' },
  historyNote: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  historyScore: { fontSize: 12.5, fontWeight: '700' },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 30, borderWidth: 1, borderRadius: 18,
  },
  emptyText: { fontSize: 13.5, fontWeight: '600' },
});
