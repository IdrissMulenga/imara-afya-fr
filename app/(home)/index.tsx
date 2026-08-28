// app/(home)/index.tsx — home dashboard.
//
// WHAT THIS SCREEN IS FOR: recording your morning without leaving it.
//
// It used to be a set of links — every card sent you somewhere else to do the
// thing. So the dashboard now WRITES: tick a dose, tick a routine, answer how
// you feel, all in place. The screens behind them still exist for everything
// else, and the links are still there, but the thirty seconds someone actually
// spends here no longer costs three navigations.
//
// Every card is backed by a real backend field:
//   • hero + banner  -> habitSummary / myMedications / cyclePrediction
//   • check-in       -> checkInSummary + saveCheckIn
//   • routines       -> todayRoutines + setRoutineDone
//   • pregnancy      -> pregnancyProgress
//   • week chart     -> myHabitLogs
//   • doses          -> myMedications + markMedicationTaken
//
// The rotating banner and a grid of cards used to show the same water and
// medication numbers twice over — that grid is gone, and the space it took is
// what the routines and the check-in now sit in.
//
// DESIGN: calm wellness. A photographic header where a photo has been added
// (see constants/photos.ts) and a layered gradient where one hasn't, generous
// whitespace, large radii. Reassurance rather than a data readout — this is
// opened by someone managing their health, often first thing in the morning.
import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, RefreshControl, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import usePullRefresh from '@/hooks/use-pull-refresh';
import { useTabBarInset } from '@/components/glass-surface';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale } from '@/components/motion';
import useDashboard from '@/hooks/use-dashboard';
import useGreeting from '@/hooks/use-greeting';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import SectionHeader from '@/components/home/section-header';
import MedicationRow from '@/components/home/medication-row';
import HeroBackdrop, { HERO_TOP_GAP, HERO_BOTTOM_GAP } from '@/components/hero-backdrop';
import CheckInCard from '@/components/home/check-in-card';
import RoutineStrip from '@/components/home/routine-strip';
import TrendChart from '@/components/home/trend-chart';
import PregnancyCard from '@/components/home/pregnancy-card';
import HighlightBanner, { type Highlight } from '@/components/home/highlight-banner';
import {
  WaterArt, MedsArt, CycleArt, WellbeingArt, RecordsArt,
} from '@/components/home/illustrations';

// ICON CHIPS. The small rounded square behind an icon — nothing else.
//
// The rotating cards used to be washed in these colours too, which made them a
// row of pastel panels sitting under a green header. They are plain surface
// cards now, like every other card on the screen, and the only colour left is
// in the artwork and the progress bar.
const WASH = {
  water: '#DCFCE7',
  records: '#FEF3C7',
};

// ACCENTS — artwork, progress bars, chart bars.
//
// Hydration, medicines and weight share the brand green: they were blue and
// violet, then teal and amber, and both read as borrowed from a different app.
// The cards are told apart by their artwork and their title rather than by
// colour, which is the honest way round — a colour has to be learned before it
// means anything. The cycle keeps pink because that is the convention every
// other period tracker uses.
const TINT = {
  water: '#0F7A54',
  meds: '#0F7A54',
  cycle: '#DB2777',
  weight: '#0F7A54',
  records: '#B45309',
};

// BIG, AND FLOATING ON THE SEAM. Large enough that a face is a face rather
// than a thumbnail — this is the only picture of the user anywhere in the app.
const AVATAR_SIZE = 96;

export default function HomeScreen() {
  const { c, radius } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  // on iOS 26 the tab bar floats over the content as glass, so give that
  // height back as padding. Zero on Android and older iPhones.
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const {
    me, isWoman, recordCount, dueToday, dueCount, takenCount, cycle, pregnancy,
    habits, waterWeek, checkIn, routines, routinesDone, routinesDue,
    markTaken, setRoutineDone, saveCheckIn, savingCheckIn, loading, refetch,
  } = useDashboard();

  // the spinner shows for a pull, not for every background refetch
  const { refreshing, onRefresh } = usePullRefresh(refetch);

  // updates itself when noon / 6pm passes, and when the app is reopened
  const greetingKey = useGreeting();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyRoutine, setBusyRoutine] = useState<string | null>(null);

  // The header used to carry a row of small stat cards that folded away on
  // scroll. They repeated numbers the carousel below already showed, and the
  // machinery that collapsed them — a scroll handler, a measured height, two
  // shared values and an interpolation — existed only to make room for that
  // repetition. Removing the cards removed all of it, and the greeting now sits
  // in a header that is a header rather than a dashboard of its own.
  const firstName = me?.firstName?.trim() || '';

  // `key` is medicationId@slot — unique per dose, so only the row actually
  // tapped shows a spinner when a medicine appears twice in the day
  const onMarkTaken = async (key: string, id: string, slot: string | null) => {
    setBusyId(key);
    try {
      await markTaken(id, slot);
      toast.success(t.doseLogged);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    } finally {
      setBusyId(null);
    }
  };

  const onToggleRoutine = async (id: string, done: boolean) => {
    setBusyRoutine(id);
    try {
      await setRoutineDone(id, done);
      // only celebrate the tick, not the untick — undoing a mis-tap should be
      // quiet, and a toast on every tap is noise on a list of six
      if (done) toast.success(t.routineDone);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    } finally {
      setBusyRoutine(null);
    }
  };

  const onSaveCheckIn = async (mood: number, energy: number) => {
    try {
      await saveCheckIn(mood, energy);
      toast.success(t.checkInSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  const highlights = useMemo(() => {
    const list: Highlight[] = [];

    const waterGoal = habits?.waterGoal ?? 8;
    const waterToday = habits?.waterToday ?? 0;

    if (dueToday.length) {
      list.push({
        key: 'meds',
        title: t.medicationsToday,
        value: String(dueCount),
        unit: `/ ${dueToday.length}`,
        caption: dueCount === 0 ? t.nothingDue : `${takenCount} ${t.takenToday}`,
        progress: takenCount / dueToday.length,
        tint: TINT.meds,
        art: <MedsArt size={84} color={TINT.meds} />,
        onPress: () => router.push('/(home)/medications'),
      });
    }

    list.push({
      key: 'water',
      title: t.hydration,
      value: String(waterToday),
      unit: `/ ${waterGoal}`,
      caption: habits?.waterStreak
        ? `${habits.waterStreak} ${t.dayShort} ${t.streakShort}`
        : t.thisWeek,
      progress: waterGoal ? waterToday / waterGoal : 0,
      tint: TINT.water,
      art: <WaterArt size={84} color={TINT.water} />,
      onPress: () => router.push('/(home)/habits'),
    });

    if (isWoman && cycle?.basedOnCycles) {
      list.push({
        key: 'cycle',
        title: t.periodTracker,
        value: cycle.daysUntilNextPeriod != null
          ? String(Math.max(cycle.daysUntilNextPeriod, 0))
          : '—',
        unit: cycle.daysUntilNextPeriod != null ? t.daysShort : undefined,
        caption: t.nextPeriodIn,
        tint: TINT.cycle,
        art: <CycleArt size={84} color={TINT.cycle} />,
        onPress: () => router.push('/(home)/cycle'),
      });
    }

    if (habits?.latestWeight != null) {
      list.push({
        key: 'weight',
        title: t.weightTitle,
        value: String(habits.latestWeight),
        unit: t.kgShort,
        caption: habits.bmi != null ? `${t.bmiLabel} ${habits.bmi}` : t.thisWeek,
        tint: TINT.weight,
        art: <WellbeingArt size={84} color={TINT.weight} />,
        onPress: () => router.push('/(home)/habits'),
      });
    }

    // Never show an empty banner. A new account has no doses, no water and no
    // cycle history, so it gets a card that points at the first useful thing.
    if (list.length === 1 && !recordCount) {
      list.push({
        key: 'records',
        title: t.healthRecords,
        value: String(recordCount),
        caption: t.addFirstRecord,
        tint: TINT.records,
        art: <RecordsArt size={84} color={TINT.records} />,
        onPress: () => router.push('/(home)/records'),
      });
    }

    return list;
  }, [
    habits, dueToday.length, dueCount, takenCount, isWoman, cycle, recordCount, t,
  ]);

  const showPregnancy = isWoman && pregnancy?.active;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />

      {/* THE HEADER, AND THE AVATAR THAT STRADDLES IT.

          The avatar is a SIBLING of the header, not a child of it. HeroBackdrop
          clips its contents so a photograph can't spill past the rounded
          corners — and that same clip would slice the bottom half off anything
          hanging over the edge. Positioned absolutely from out here, it hangs
          over the seam instead of being cut by it. */}
      {/* zIndex/elevation are what stop the cards covering the avatar.

          The ScrollView is a LATER sibling, so by default it paints on top of
          everything before it — including the half of the avatar hanging below
          the header, which is exactly the half that makes it look like it is
          floating. Lifting the header above the scroller puts it back in front.
          Both properties are needed: iOS orders by zIndex, Android by
          elevation, and setting one without the other fixes it on one platform
          and leaves the bug on the other. */}
      <View style={styles.heroLayer}>
        <HeroBackdrop style={[styles.hero, { paddingTop: insets.top + HERO_TOP_GAP }]}>
          <View style={styles.heroTop}>
            <Text style={styles.greeting}>{t[greetingKey]},</Text>
            <Text style={styles.name} numberOfLines={1}>
              {firstName || t.home}
            </Text>
          </View>
        </HeroBackdrop>

        {/* tap to view / edit profile — shows the photo once one is set */}
        <PressableScale
          onPress={() => router.push('/(home)/profile')}
          hitSlop={8}
          style={[
            styles.avatarBtn,
            {
              // the ring is the page colour, so the avatar reads as sitting in
              // front of both the green and the body rather than on either
              borderColor: c.bg,
              backgroundColor: c.surface,
              shadowColor: '#0B3A2A',
            },
          ]}
        >
          {me?.image ? (
            <Image source={{ uri: me.image }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person-outline" size={30} color={c.primary} />
          )}
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 36 + tabBarInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >
        {/* Rotating highlight — full bleed, and flush against the header. No
            wrapper padding at all: the card supplies its own inner spacing, and
            anything here would put a stripe of page background between the
            green and the card. */}
        <FadeIn index={0} style={styles.bannerWrap}>
          <HighlightBanner items={highlights} />
        </FadeIn>

        <View style={styles.body}>
          {/* ------------- how are you today ------------- */}
          <FadeIn index={1}>
            <CheckInCard
              mood={checkIn?.today?.mood}
              energy={checkIn?.today?.energy}
              streak={checkIn?.streak}
              busy={savingCheckIn}
              onSave={onSaveCheckIn}
              onOpen={() => router.push('/(home)/check-in')}
            />
          </FadeIn>

          {/* ------------- pregnancy, while there is one ------------- */}
          {showPregnancy && (
            <FadeIn index={2}>
              <PregnancyCard
                weeksPregnant={pregnancy.weeksPregnant}
                daysIntoWeek={pregnancy.daysIntoWeek}
                trimester={pregnancy.trimester}
                daysUntilDue={pregnancy.daysUntilDue}
                overdue={pregnancy.overdue}
                onPress={() => router.push('/(home)/pregnancy')}
              />
            </FadeIn>
          )}

          {/* ------------- today's routines ------------- */}
          <View style={{ height: 10 }} />
          <SectionHeader
            title={t.routinesTitle}
            actionLabel={t.viewAll}
            onAction={() => router.push('/(home)/routines')}
          />

          <FadeIn index={3}>
            <RoutineStrip
              routines={routines}
              doneCount={routinesDone}
              dueCount={routinesDue}
              busyId={busyRoutine}
              onToggle={onToggleRoutine}
              onAdd={() => router.push('/(home)/routines')}
            />
          </FadeIn>

          {/* ------------- medications today ------------- */}
          <View style={{ height: 12 }} />
          <SectionHeader
            title={t.medicationsToday}
            actionLabel={t.viewAll}
            onAction={() => router.push('/(home)/medications')}
          />

          {loading && !dueToday.length ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 20 }} />
          ) : dueToday.length ? (
            <View style={{ gap: 10 }}>
              {dueToday.map((dose, i) => (
                <FadeIn key={dose.key} index={i + 4}>
                  <MedicationRow
                    name={dose.name}
                    dosage={dose.dosage}
                    slot={dose.slot}
                    taken={dose.taken}
                    status={dose.status}
                    busy={busyId === dose.key}
                    onMarkTaken={() => onMarkTaken(dose.key, dose.medicationId, dose.slot)}
                  />
                </FadeIn>
              ))}
            </View>
          ) : (
            <PressableScale
              onPress={() => router.push('/(home)/medications')}
              style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <Ionicons name="medkit-outline" size={24} color={c.textFaint} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noMedications}</Text>
            </PressableScale>
          )}

          {/* ------------- the week behind you ------------- */}
          <View style={{ height: 12 }} />
          <SectionHeader
            title={t.thisWeek}
            actionLabel={t.viewAll}
            onAction={() => router.push('/(home)/habits')}
          />

          <FadeIn index={5}>
            <PressableScale
              onPress={() => router.push('/(home)/habits')}
              style={[styles.chartCard, {
                backgroundColor: c.surface, borderColor: c.border, borderRadius: radius + 4,
              }]}
            >
              <View style={styles.chartHead}>
                <View style={[styles.chartIcon, { backgroundColor: WASH.water }]}>
                  <Ionicons name="water" size={17} color={TINT.water} />
                </View>
                <Text style={[styles.chartTitle, { color: c.text }]}>{t.hydration}</Text>
              </View>

              <TrendChart
                data={waterWeek}
                goal={habits?.waterGoal ?? 8}
                color={TINT.water}
                unit={t.glasses}
              />
            </PressableScale>
          </FadeIn>

          {/* ------------- records ------------- */}
          <FadeIn index={6}>
            <PressableScale
              onPress={() => router.push('/(home)/records')}
              style={[styles.recordsRow, {
                backgroundColor: c.surface, borderColor: c.border, borderRadius: radius + 4,
              }]}
            >
              <View style={[styles.chartIcon, { backgroundColor: WASH.records }]}>
                <Ionicons name="folder" size={17} color={TINT.records} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.chartTitle, { color: c.text }]}>{t.healthRecords}</Text>
                <Text style={[styles.recordsSub, { color: c.textMuted }]}>
                  {recordCount ? `${recordCount} ${t.savedLower}` : t.addFirstRecord}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
            </PressableScale>
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroLayer: { zIndex: 2, elevation: 2 },
  hero: {
    paddingHorizontal: 22,
    // the shared bottom gap plus a little more, so the avatar has somewhere to
    // hang into without crowding the greeting above it
    paddingBottom: HERO_BOTTOM_GAP + 8,
  },
  // the avatar is out of this row now, so the greeting has the full width
  heroTop: { paddingRight: AVATAR_SIZE + 16 },
  greeting: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontWeight: '600' },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 3 },

  // HALF ON THE GREEN, HALF ON THE BODY. `bottom` is exactly minus half the
  // height, which is what puts the seam through the middle of the circle
  // whatever the header ends up being — no measuring, no magic number that
  // breaks when the greeting wraps to two lines.
  avatarBtn: {
    position: 'absolute',
    right: 22,
    bottom: -AVATAR_SIZE / 2,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // lifts it off both surfaces — without this it reads as a hole punched in
    // the header rather than as something sitting in front of it
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2 },
  // clears the half of the avatar hanging below the header, with air to spare
  bannerWrap: { paddingTop: AVATAR_SIZE / 2 + 18 },
  body: { paddingHorizontal: 22, paddingTop: 20, gap: 12 },

  chartCard: { borderWidth: 1, padding: 16, gap: 14 },
  chartHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chartIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chartTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },

  recordsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 15 },
  recordsSub: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 30, borderWidth: 1, borderRadius: 22,
  },
  emptyText: { fontSize: 13.5, fontWeight: '600' },
});
