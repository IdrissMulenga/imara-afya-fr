// app/(home)/index.tsx — home dashboard.
// Layout follows the Imara Afya design (green hero + stat tiles, quick actions,
// medications list) but every card is backed by a REAL backend field:
//   • stats        -> myHealthRecords / myMedications / cyclePrediction
//   • quick actions-> the features that actually exist
//   • medications  -> myMedications + markMedicationTaken
import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale } from '@/components/motion';
import useDashboard from '@/hooks/use-dashboard';
import useGreeting from '@/hooks/use-greeting';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import StatCard from '@/components/home/stat-card';
import FeatureCard from '@/components/home/feature-card';
import ProgressRing from '@/components/home/progress-ring';
import Sparkline from '@/components/home/sparkline';
import SectionHeader from '@/components/home/section-header';
import MedicationRow from '@/components/home/medication-row';

export default function HomeScreen() {
  const { c, dark } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const {
    me, isWoman, recordCount, dueToday, dueCount, takenCount, cycle,
    habits, waterWeek, markTaken, loading, refetch,
  } = useDashboard();

  // updates itself when noon / 6pm passes, and when the app is reopened
  const greetingKey = useGreeting();

  const [busyId, setBusyId] = useState<string | null>(null);

  const firstName = me?.firstName?.trim() || '';

  const onMarkTaken = async (id: string) => {
    setBusyId(id);
    try {
      await markTaken(id);
      toast.success(t.doseLogged);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={c.primary} />
        }
      >
        {/* ---------------- green hero ---------------- */}
        <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 16 }]}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{t[greetingKey]},</Text>
              <Text style={styles.name} numberOfLines={1}>
                {firstName || t.home} 👋
              </Text>
            </View>

            {/* tap to view / edit profile — shows the photo once one is set */}
            <PressableScale
              onPress={() => router.push('/(home)/profile')}
              hitSlop={8}
              style={styles.avatarBtn}
            >
              {me?.image ? (
                <Image source={{ uri: me.image }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person-outline" size={20} color="#fff" />
              )}
            </PressableScale>
          </View>

          {/* stats — real counts from the backend */}
          <FadeIn index={1} style={styles.statRow}>
            <StatCard icon="folder-outline" value={recordCount} label={t.statRecords} />
            <StatCard icon="medkit-outline" value={dueCount} label={t.statMedsDue} />
            {isWoman && (
              <StatCard
                icon="calendar-outline"
                value={cycle?.daysUntilNextPeriod ?? '—'}
                unit={cycle?.daysUntilNextPeriod != null ? t.daysShort : undefined}
                label={t.statNextPeriod}
              />
            )}
          </FadeIn>
        </View>

        {/* ---------------- body ---------------- */}
        <View style={styles.body}>
          <SectionHeader title={t.quickActions} />

          {/* Water — a ring plus the week's bars. The card is worth reading
              even without tapping it, which the old static tiles were not. */}
          <FadeIn index={2}>
            <FeatureCard
              wide
              icon="water"
              tint="#DBEAFE"
              iconColor="#2563EB"
              title={t.hydration}
              value={habits?.waterToday ?? 0}
              unit={`/ ${habits?.waterGoal ?? 8}`}
              caption={
                habits?.waterStreak
                  ? `${habits.waterStreak} ${t.dayShort} ${t.streakShort} · ${t.thisWeek}`
                  : t.thisWeek
              }
              badge={habits?.waterGoalMet ? '✓' : undefined}
              accessory={
                <View style={{ width: 96 }}>
                  <Sparkline
                    data={waterWeek}
                    goal={habits?.waterGoal ?? 8}
                    color="#2563EB"
                  />
                </View>
              }
              onPress={() => router.push('/(home)/habits')}
            />
          </FadeIn>

          <FadeIn index={3} style={styles.grid}>
            <FeatureCard
              icon="medkit"
              tint="#DCFCE7"
              iconColor="#0F7A54"
              title={t.medications}
              value={dueCount}
              unit={dueToday.length ? `/ ${dueToday.length}` : undefined}
              caption={dueToday.length ? `${takenCount} ${t.takenToday}` : t.nothingDue}
              accessory={
                dueToday.length ? (
                  <ProgressRing
                    progress={takenCount / dueToday.length}
                    size={54}
                    stroke={5}
                    color="#0F7A54"
                    label={`${Math.round((takenCount / dueToday.length) * 100)}%`}
                  />
                ) : undefined
              }
              onPress={() => router.push('/(home)/medications')}
            />

            {isWoman ? (
              <FeatureCard
                icon="calendar"
                tint="#FCE7F3"
                iconColor="#DB2777"
                title={t.periodTracker}
                value={cycle?.daysUntilNextPeriod != null
                  ? Math.max(cycle.daysUntilNextPeriod, 0)
                  : '—'}
                unit={cycle?.daysUntilNextPeriod != null ? t.daysShort : undefined}
                caption={cycle?.basedOnCycles ? t.nextPeriodIn : t.tapToStart}
                // don't imply precision the backend says it doesn't have
                badge={cycle?.confidence === 'low' && cycle?.basedOnCycles ? '~' : undefined}
                onPress={() => router.push('/(home)/cycle')}
              />
            ) : (
              <FeatureCard
                icon="fitness"
                tint="#EDE9FE"
                iconColor="#7C3AED"
                title={t.weightTitle}
                value={habits?.latestWeight ?? '—'}
                unit={habits?.latestWeight != null ? t.kgShort : undefined}
                caption={habits?.bmi != null ? `${t.bmiLabel} ${habits.bmi}` : t.tapToStart}
                onPress={() => router.push('/(home)/habits')}
              />
            )}
          </FadeIn>

          <FadeIn index={4} style={styles.grid}>
            <FeatureCard
              icon="folder"
              tint="#FEF3C7"
              iconColor="#B45309"
              title={t.healthRecords}
              value={recordCount}
              caption={recordCount ? t.savedLower : t.addFirstRecord}
              onPress={() => router.push('/(home)/records')}
            />

            <FeatureCard
              icon="location"
              tint="#FEE2E2"
              iconColor="#DC2626"
              title={t.findCare}
              caption={t.clinicsNearYou}
              onPress={() => router.push('/(home)/care')}
            />
          </FadeIn>

          {/* ------------- medications today ------------- */}
          <View style={{ height: 26 }} />
          <SectionHeader
            title={t.medicationsToday}
            actionLabel={t.viewAll}
            // onAction={() => router.push('/(home)/medications')}
          />

          <View style={{ height: 12 }} />

          {loading && !dueToday.length ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 20 }} />
          ) : dueToday.length ? (
            <View style={{ gap: 10 }}>
              {dueToday.map((m, i) => (
                <FadeIn key={m.id} index={i + 5}>
                  <MedicationRow
                    name={m.name}
                    dosage={m.dosage}
                    times={m.times}
                    taken={m.taken}
                    busy={busyId === m.id}
                    onMarkTaken={() => onMarkTaken(m.id)}
                  />
                </FadeIn>
              ))}
            </View>
          ) : (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="medkit-outline" size={22} color={c.textFaint} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noMedications}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14.5, fontWeight: '600' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 22 },

  body: { paddingHorizontal: 22, paddingTop: 24, gap: 12 },
  grid: { flexDirection: 'row', gap: 12 },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 28, borderWidth: 1, borderRadius: 18,
  },
  emptyText: { fontSize: 13.5, fontWeight: '600' },
});
