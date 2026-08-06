// app/(home)/cycle.tsx — period tracker. Women only.
// Backed by myCycles / cyclePrediction / logPeriod / updatePeriod / removePeriod.
import { useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, RefreshControl, Alert,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale } from '@/components/motion';
import useCycle, { periodLength } from '@/hooks/use-cycle';
import CycleSheet from '@/components/cycle/cycle-sheet';
import CycleCalendar from '@/components/cycle/cycle-calendar';
import CycleChart from '@/components/cycle/cycle-chart';
import RegularityCard from '@/components/cycle/regularity-card';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import type { PeriodCycle } from '@/graphql';

export default function CycleScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { width } = useWindowDimensions();

  const {
    isWoman, cycles, openCycle, prediction,
    startToday, endToday, logPeriod, updatePeriod, removePeriod,
    setRegularity, needsRegularityAnswer,
    saving, loading, refetch,
  } = useCycle();

  const [editing, setEditing] = useState<PeriodCycle | null>(null);

  // COLLAPSING HEADER — same behaviour as the dashboard.
  // The title stays; the big day counter folds away so the calendar and chart
  // get the screen once she starts reading them.
  const scrollY = useSharedValue(0);
  const statHeight = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const bigStatStyle = useAnimatedStyle(() => {
    // no height constraint until measured — constraining first pins it at zero
    // and onLayout then reports zero, so it would never appear at all
    if (!statHeight.value) {
      return { marginTop: 24, opacity: 1 };
    }

    const from = [0, 90];

    return {
      height: interpolate(scrollY.value, from, [statHeight.value, 0], Extrapolation.CLAMP),
      opacity: interpolate(scrollY.value, from, [1, 0], Extrapolation.CLAMP),
      marginTop: interpolate(scrollY.value, from, [24, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollY.value, from, [0, -10], Extrapolation.CLAMP) },
      ],
    };
  });

  // the tab is hidden for men, but guard the screen too in case it's deep-linked
  if (!isWoman && !loading) {
    return (
      <View style={[styles.blocked, { backgroundColor: c.bg }]}>
        <Ionicons name="lock-closed-outline" size={28} color={c.textFaint} />
      </View>
    );
  }

  // The single button does whichever thing makes sense right now: start a
  // period, or close the one that's running. Showing both at once would let
  // her log a second period on top of an open one, which the backend rejects.
  const onPrimary = async () => {
    try {
      if (openCycle) {
        await endToday();
        toast.success(t.periodEnded);
      } else {
        await startToday();
        toast.success(t.periodLogged);
      }
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  // Tapping a past day on the calendar logs a period starting then. Women
  // usually remember a day or two late rather than on the morning it starts,
  // so "today only" would quietly push every record forward.
  const onSelectDay = (iso: string) => {
    Alert.alert(`${t.logOnDate} ${iso}?`, t.logOnDateBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm,
        onPress: async () => {
          try {
            await logPeriod({ startDate: iso });
            toast.success(t.periodLogged);
          } catch (err) {
            // the backend refuses duplicates and unclosed cycles — surface why
            toast.error(errorMessage(err, t.errGeneric));
          }
        },
      },
    ]);
  };

  const onRegularity = async (value: 'regular' | 'irregular' | 'unknown') => {
    try {
      await setRegularity(value);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  const onSave = async (values: { startDate: string; endDate?: string }) => {
    if (!editing) return;

    try {
      await updatePeriod(editing.id, values);
      setEditing(null);
      toast.success(t.cycleSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  const onRemove = () => {
    if (!editing) return;

    Alert.alert(t.removeCycleTitle, t.removeCycleBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await removePeriod(editing.id);
            setEditing(null);
            toast.success(t.cycleRemoved);
          } catch (err) {
            toast.error(errorMessage(err, t.errGeneric));
          }
        },
      },
    ]);
  };

  const days = prediction?.daysUntilNextPeriod;
  const fertile = prediction?.daysUntilFertileWindow;

  // "low" means either she told us her cycle varies, or her own logs say so
  const lowConfidence = prediction?.confidence === 'low';

  // while she's bleeding, a "next period in N days" countdown is meaningless —
  // show how long the current one has run instead
  const currentDay = openCycle ? periodLength(openCycle.startDate, new Date().toISOString().slice(0, 10)) : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />

      {/* fixed header — stays put while the body scrolls */}
      <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroTitle}>{t.cycleTitle}</Text>
        <Text style={styles.heroSub}>{t.cycleSub}</Text>

        <Animated.View style={[styles.statCollapse, bigStatStyle]}>
          <View
            style={styles.bigStat}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (!statHeight.value && h > 0) statHeight.value = h;
            }}
          >
            {openCycle ? (
              <>
                <Text style={styles.bigNumber}>{currentDay ?? 1}</Text>
                <Text style={styles.bigLabel}>
                  {t.periodOngoing} · {t.startedOn} {openCycle.startDate}
                </Text>
              </>
            ) : (
              <>
                {/* a precise number on a cycle that varies would be a lie —
                    say "around" and label it as rough instead */}
                <Text style={styles.bigNumber}>
                  {days != null ? `${lowConfidence ? '~' : ''}${Math.max(days, 0)}` : '—'}
                </Text>
                <Text style={styles.bigLabel}>
                  {days != null ? `${t.nextPeriodIn.toLowerCase()} ${t.dayCountPlural}` : t.nextPeriodIn}
                </Text>
                {!!prediction?.basedOnCycles && lowConfidence && (
                  <Text style={styles.confidenceTag}>{t.confidenceLow}</Text>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={c.primary} />
        }
      >

        <View style={styles.body}>
          <PressableScale
            onPress={onPrimary}
            disabled={saving}
            style={[styles.primary, { backgroundColor: openCycle ? c.primaryDeep : c.primary }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={openCycle ? 'checkmark-circle-outline' : 'water-outline'}
                  size={19}
                  color="#fff"
                />
                <Text style={styles.primaryText}>
                  {openCycle ? t.endPeriodCta : t.logPeriodAny}
                </Text>
              </>
            )}
          </PressableScale>

          {/* summary tiles — only meaningful once she has logged something */}
          {!!prediction?.basedOnCycles && (
            <FadeIn index={1} style={styles.tileRow}>
              <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.tileValue, { color: c.text }]}>
                  {prediction.averageCycleLength}
                </Text>
                <Text style={[styles.tileLabel, { color: c.textMuted }]}>{t.avgCycle}</Text>
              </View>

              <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.tileValue, { color: c.text }]}>
                  {prediction.averagePeriodLength ?? '—'}
                </Text>
                <Text style={[styles.tileLabel, { color: c.textMuted }]}>{t.avgPeriod}</Text>
              </View>

              <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.tileValue, { color: c.text }]}>
                  {fertile != null ? Math.max(fertile, 0) : '—'}
                </Text>
                <Text style={[styles.tileLabel, { color: c.textMuted }]}>{t.fertileWindowIn}</Text>
              </View>
            </FadeIn>
          )}

          {/* asked once, then never again unless she changes it */}
          {needsRegularityAnswer && (
            <FadeIn index={1} style={{ marginTop: 18 }}>
              <RegularityCard onAnswer={onRegularity} />
            </FadeIn>
          )}

          {/* why the countdown is vague, when it is */}
          {!needsRegularityAnswer && lowConfidence && !!prediction?.basedOnCycles && (
            <View style={[styles.noticeRow, { backgroundColor: c.ring }]}>
              <Ionicons name="information-circle-outline" size={16} color={c.primary} />
              <Text style={[styles.noticeText, { color: c.primary }]}>{t.lowConfidenceNote}</Text>
            </View>
          )}

          {/* raised from her own data only — a prompt to ask someone, not a diagnosis */}
          {prediction?.irregularityFlag && (
            <View style={[styles.noticeRow, { backgroundColor: c.dangerRing }]}>
              <Ionicons name="alert-circle-outline" size={16} color={c.danger} />
              <Text style={[styles.noticeText, { color: c.danger }]}>
                {t.irregularNote.replace('{days}', String(prediction.cycleVariation ?? 0))}
              </Text>
            </View>
          )}

          {/* calendar */}
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.calendarTitle}</Text>

          <FadeIn index={2}>
            <CycleCalendar cycles={cycles} prediction={prediction} onSelectDay={onSelectDay} />
          </FadeIn>

          {/* cycle length over time */}
          {cycles.length >= 3 && (
            <>
              <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.chartTitle}</Text>

              <FadeIn index={3}>
                <CycleChart cycles={cycles} width={width - 44} />
              </FadeIn>
            </>
          )}

          {/* history */}
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.cycleHistory}</Text>

          {loading && !cycles.length ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 20 }} />
          ) : !cycles.length ? (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="calendar-outline" size={28} color={c.textFaint} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noCycles}</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noCyclesSub}</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {cycles.map((cycle, i) => {
                const length = periodLength(cycle.startDate, cycle.endDate);

                return (
                  <FadeIn key={cycle.id} index={i + 4}>
                    {/* tap to correct a date, close an open period, or delete a mis-tap */}
                    <PressableScale
                      onPress={() => setEditing(cycle)}
                      style={[styles.cycleRow, { backgroundColor: c.surface, borderColor: c.border }]}
                    >
                      <View style={[styles.dot, { backgroundColor: cycle.endDate ? c.primary : c.danger }]} />

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cycleDate, { color: c.text }]}>{cycle.startDate}</Text>
                        <Text style={[styles.cycleMeta, { color: c.textMuted }]}>
                          {cycle.endDate
                            ? `→ ${cycle.endDate} · ${length} ${length === 1 ? t.dayCount : t.dayCountPlural}`
                            : t.ongoing}
                        </Text>
                      </View>

                      <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
                    </PressableScale>
                  </FadeIn>
                );
              })}
            </View>
          )}

          {/* predictions are estimates — say so plainly */}
          {!!prediction?.basedOnCycles && (
            <View style={styles.noteRow}>
              <Ionicons name="information-circle-outline" size={15} color={c.textFaint} />
              <Text style={[styles.noteText, { color: c.textFaint }]}>
                {t.predictionNote} {t.basedOn} {prediction.basedOnCycles} {t.cyclesLower}.
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <CycleSheet
        visible={!!editing}
        cycle={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={onSave}
        onRemove={onRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    paddingHorizontal: 22, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 6 },
  // the collapsing wrapper owns the margin so it can animate to zero;
  // overflow hidden is what clips the counter as it shrinks
  statCollapse: { overflow: 'hidden' },
  bigStat: { alignItems: 'center' },
  bigNumber: { color: '#fff', fontSize: 54, fontWeight: '800', letterSpacing: -2 },
  bigLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 2 },

  body: { paddingHorizontal: 22, paddingTop: 22 },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
  },
  primaryText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },

  tileRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center' },
  tileValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },
  tileLabel: { fontSize: 11.5, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: 28, marginBottom: 12,
  },
  cycleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderWidth: 1, borderRadius: 16,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  cycleDate: { fontSize: 15, fontWeight: '700' },
  cycleMeta: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 36, paddingHorizontal: 26, borderWidth: 1, borderRadius: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  emptyText: { fontSize: 13.5, fontWeight: '500', textAlign: 'center', lineHeight: 19 },

  confidenceTag: {
    color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800',
    marginTop: 6, letterSpacing: 0.3, textTransform: 'uppercase',
  },
  noticeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 13, borderRadius: 14, marginTop: 16,
  },
  noticeText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 20 },
  noteText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },
});
