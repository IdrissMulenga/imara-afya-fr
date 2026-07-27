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
import useDashboard from '@/hooks/use-dashboard';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import StatCard from '@/components/home/stat-card';
import QuickAction from '@/components/home/quick-action';
import SectionHeader from '@/components/home/section-header';
import MedicationRow from '@/components/home/medication-row';

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) return 'goodMorning' as const;
  if (h < 18) return 'goodAfternoon' as const;
  return 'goodEvening' as const;
};

export default function HomeScreen() {
  const { c, dark } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const {
    me, isWoman, recordCount, dueToday, dueCount, cycle,
    markTaken, loading, refetch,
  } = useDashboard();

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
              <Text style={styles.greeting}>{t[greetingKey()]},</Text>
              <Text style={styles.name} numberOfLines={1}>
                {firstName || t.home} 👋
              </Text>
            </View>

            {/* tap to view / edit profile — shows the photo once one is set */}
            <Pressable
              onPress={() => router.push('/(home)/profile')}
              hitSlop={8}
              style={styles.avatarBtn}
            >
              {me?.image ? (
                <Image source={{ uri: me.image }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person-outline" size={20} color="#fff" />
              )}
            </Pressable>
          </View>

          {/* stats — real counts from the backend */}
          <View style={styles.statRow}>
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
          </View>
        </View>

        {/* ---------------- body ---------------- */}
        <View style={styles.body}>
          <SectionHeader title={t.quickActions} />

          <View style={styles.grid}>
            <QuickAction
              icon="folder-outline"
              tint="#DCFCE7"
              title={t.healthRecords}
              subtitle={recordCount ? `${recordCount} ${t.savedLower}` : t.addFirstRecord}
              // onPress={() => router.push('/(home)/records')}
            />
            <QuickAction
              icon="location-outline"
              tint="#FEF3C7"
              title={t.findCare}
              subtitle={t.clinicsNearYou}
              // onPress={() => router.push('/(home)/care')}
            />
          </View>

          <View style={styles.grid}>
            <QuickAction
              icon="medkit-outline"
              tint="#DBEAFE"
              title={t.medications}
              subtitle={dueCount ? `${dueCount} ${t.dueToday}` : t.allDone}
              // onPress={() => router.push('/(home)/medications')}
            />
            {isWoman ? (
              <QuickAction
                icon="calendar-outline"
                tint="#FCE7F3"
                title={t.periodTracker}
                subtitle={
                  cycle?.daysUntilNextPeriod != null
                    ? `${cycle.daysUntilNextPeriod} ${t.daysToGo}`
                    : t.trackWellness
                }
                // onPress={() => router.push('/(home)/cycle')}
              />
            ) : (
              <QuickAction
                icon="person-outline"
                tint="#F3E8FF"
                title={t.myProfile}
                subtitle={me?.plan === 'premium' ? t.planPremium : t.planFree}
                onPress={() => router.push('/(home)/profile')}
              />
            )}
          </View>

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
              {dueToday.map((m) => (
                <MedicationRow
                  key={m.id}
                  name={m.name}
                  dosage={m.dosage}
                  times={m.times}
                  taken={m.taken}
                  busy={busyId === m.id}
                  onMarkTaken={() => onMarkTaken(m.id)}
                />
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
