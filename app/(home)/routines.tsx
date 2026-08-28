// app/(home)/routines.tsx — the things you decided to do each day.
//
// Two lists, and the split matters: what's DUE today (the list you work
// through) and everything you've set up (the list you manage). Showing all
// routines every day with most of them greyed out would make a weekday-only
// habit look permanently unfinished.
import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert,
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
import { FadeIn, PressableScale, ProgressBar } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import RoutineSheet from '@/components/routines/routine-sheet';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import useRoutines from '@/hooks/use-routines';
import type { Routine } from '@/graphql';

export default function RoutinesScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const {
    due, doneCount, dueCount, all, add, update, remove, setDone,
    saving, loading, refetch,
  } = useRoutines();

  // the spinner shows for a pull, not for every background refetch
  const { refreshing, onRefresh } = usePullRefresh(refetch);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (routine: Routine) => { setEditing(routine); setSheetOpen(true); };

  const onToggle = async (routine: Routine) => {
    setBusyId(routine.id);
    try {
      await setDone(routine.id, !routine.done);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    } finally {
      setBusyId(null);
    }
  };

  const onSave = async (values: { title: string; icon: string; days: number[]; time?: string }) => {
    try {
      if (editing) await update(editing.id, values);
      else await add(values);

      setSheetOpen(false);
      toast.success(t.routineSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  // Removing takes the streak history with it, so confirm rather than
  // let a mis-tap delete weeks of progress.
  const onRemove = () => {
    if (!editing) return;

    Alert.alert(t.removeRoutineTitle, t.removeRoutineBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(editing.id);
            setSheetOpen(false);
            toast.success(t.routineRemoved);
          } catch (err) {
            toast.error(errorMessage(err, t.errGeneric));
          }
        },
      },
    ]);
  };

  // routines not due today, so they're only in the manage list
  const others = all.filter((r) => !due.some((d) => d.id === r.id));

  const progress = dueCount ? doneCount / dueCount : 0;

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
          <Text style={styles.heroTitle}>{t.routinesTitle}</Text>
        </View>
        <Text style={styles.heroSub}>{t.routinesSub}</Text>

        {/* progress through today, only when there is something to progress */}
        {dueCount > 0 && (
          <View style={styles.heroProgress}>
            <Text style={styles.heroCount}>
              {doneCount} / {dueCount} {t.doneToday}
            </Text>
            <View style={{ marginTop: 8 }}>
              <ProgressBar
                progress={progress}
                color="#fff"
                trackColor="rgba(255,255,255,0.28)"
                height={6}
              />
            </View>
          </View>
        )}
      </HeroBackdrop>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 + tabBarInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >
        <View style={styles.body}>
          {loading && !due.length && !all.length ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 32 }} />
          ) : !all.length ? (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="repeat-outline" size={30} color={c.textFaint} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noRoutinesToday}</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noRoutinesTodaySub}</Text>
            </View>
          ) : (
            <>
              {/* ------------------- due today ------------------- */}
              {due.map((routine, i) => (
                <FadeIn key={routine.id} index={i}>
                  <View style={styles.rowWrap}>
                    <PressableScale
                      onPress={() => onToggle(routine)}
                      disabled={busyId === routine.id}
                      style={[
                        styles.row,
                        {
                          backgroundColor: c.surface,
                          borderColor: routine.done ? c.primary : c.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.check,
                          {
                            backgroundColor: routine.done ? c.primary : 'transparent',
                            borderColor: routine.done ? c.primary : c.borderStrong,
                          },
                        ]}
                      >
                        {busyId === routine.id
                          ? <ActivityIndicator size="small" color={routine.done ? '#fff' : c.primary} />
                          : routine.done
                            ? <Ionicons name="checkmark" size={17} color="#fff" />
                            : null}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.rowTitle,
                            {
                              color: routine.done ? c.textMuted : c.text,
                              textDecorationLine: routine.done ? 'line-through' : 'none',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {routine.title}
                        </Text>

                        <View style={styles.metaRow}>
                          {!!routine.time && (
                            <Text style={[styles.meta, { color: c.textFaint }]}>{routine.time}</Text>
                          )}
                          {/* a streak is only worth showing once it means
                              something — "1 day streak" is just noise */}
                          {!!routine.streak && routine.streak > 1 && (
                            <Text style={[styles.streak, { color: c.primary }]}>
                              {routine.streak} {t.dayShort} {t.streakShort}
                            </Text>
                          )}
                        </View>
                      </View>

                      <Ionicons
                        name={(routine.icon as keyof typeof Ionicons.glyphMap) ?? 'checkmark-circle-outline'}
                        size={19}
                        color={c.textFaint}
                      />
                    </PressableScale>

                    <PressableScale onPress={() => openEdit(routine)} hitSlop={8} style={styles.editBtn}>
                      <Ionicons name="ellipsis-vertical" size={17} color={c.textFaint} />
                    </PressableScale>
                  </View>
                </FadeIn>
              ))}

              {!due.length && (
                <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Ionicons name="checkmark-done-outline" size={28} color={c.textFaint} />
                  <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noRoutinesToday}</Text>
                </View>
              )}

              {/* --------------- not due today --------------- */}
              {!!others.length && (
                <>
                  <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.allRoutines}</Text>

                  <View style={{ gap: 10 }}>
                    {others.map((routine, i) => (
                      <FadeIn key={routine.id} index={i}>
                        <PressableScale
                          onPress={() => openEdit(routine)}
                          style={[styles.otherRow, { backgroundColor: c.surface, borderColor: c.border }]}
                        >
                          <Ionicons
                            name={(routine.icon as keyof typeof Ionicons.glyphMap) ?? 'checkmark-circle-outline'}
                            size={18}
                            color={c.textFaint}
                          />
                          <Text style={[styles.otherName, { color: c.textMuted }]} numberOfLines={1}>
                            {routine.title}
                          </Text>
                          {!routine.active && (
                            <Text style={[styles.pausedTag, { color: c.textFaint }]}>{t.archived}</Text>
                          )}
                        </PressableScale>
                      </FadeIn>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <PressableScale
        onPress={openNew}
        style={[
          styles.fab,
          { backgroundColor: c.primary, bottom: insets.bottom + 22 + tabBarInset },
        ]}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabText}>{t.addRoutine}</Text>
      </PressableScale>

      <RoutineSheet
        visible={sheetOpen}
        routine={editing}
        saving={saving}
        onClose={() => setSheetOpen(false)}
        onSave={onSave}
        onRemove={onRemove}
      />
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 22, paddingBottom: HERO_BOTTOM_GAP },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 8 },
  heroProgress: { marginTop: 18 },
  heroCount: { color: '#fff', fontSize: 13, fontWeight: '700' },

  body: { paddingHorizontal: 22, paddingTop: 20, gap: 10 },

  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderWidth: 1, borderRadius: 16,
  },
  check: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  meta: { fontSize: 12.5, fontWeight: '600' },
  streak: { fontSize: 12.5, fontWeight: '800' },
  editBtn: { padding: 8 },

  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: 24, marginBottom: 2,
  },
  otherRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 13, borderWidth: 1, borderRadius: 14,
  },
  otherName: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  pausedTag: { fontSize: 11.5, fontWeight: '700' },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 36, paddingHorizontal: 24, borderWidth: 1, borderRadius: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13.5, fontWeight: '500', textAlign: 'center' },

  fab: {
    position: 'absolute', right: 22,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 15, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
