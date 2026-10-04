// Achievements: how many badges are earned, personal bests and longest streaks, then every badge,
// earned ones first. Opened from the dashboard.
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ErrorNote, QuietButton } from '@/components/ui';
import { Divider, Section } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { BadgeRow, useAchievements } from '@/components/achievements';
import { dateText } from '@/components/cycle';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import type { PersonalBest } from '@/graphql/achievements';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function AchievementsScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const a = APP_COPY[lang];
  const query = useAchievements();
  const data = query.data?.achievements;

  // Earned badges first, then the closest to being earned.
  const badges = useMemo(
    () =>
      [...(data?.badges ?? [])].sort(
        (x, y) => Number(y.earned) - Number(x.earned) || y.progress / y.target - x.progress / x.target
      ),
    [data]
  );

  const bests: { key: string; icon: IconName; label: string; record: PersonalBest | null; unit: string }[] = data
    ? [
        { key: 'steps', icon: 'walk', label: a.bestStepsLabel, record: data.mostSteps, unit: a.steps },
        { key: 'water', icon: 'cup-water', label: a.bestWaterLabel, record: data.mostWater, unit: a.glasses },
        { key: 'sleep', icon: 'power-sleep', label: a.bestSleepLabel, record: data.longestSleep, unit: 'h' },
      ]
    : [];

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={<AppHeader title={a.achievementsTitle} subtitle={a.achievementsSub} backLabel={t.back} onBack={() => router.back()} />}
    >
      {query.error && !data ? (
        <>
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void query.refetch()} />
        </>
      ) : null}

      {data ? (
        <>
          <FadeIn>
            <Text style={[T.body, { color: c.text }]}>
              {a.achievementsEarned.replace('{n}', String(data.earnedCount)).replace('{total}', String(data.badges.length))}
            </Text>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={40}>
            <Text style={[T.label, { color: c.faint, marginLeft: 2, marginBottom: 10 }]}>{a.personalBests}</Text>
            <View style={styles.stats}>
              {bests.map(({ key, icon, label, record, unit }) => (
                <Glass key={key} style={styles.statCard}>
                  <MaterialCommunityIcons name={icon} size={18} color={c.primary} />
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.text }} numberOfLines={1}>
                    {record ? `${record.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}` : '–'}
                  </Text>
                  <Text style={[T.fine, { color: c.muted, textAlign: 'center' }]} numberOfLines={1}>
                    {label}
                  </Text>
                  <Text style={[T.fine, { color: c.faint }]} numberOfLines={1}>
                    {record ? dateText(record.day, lang) : a.achievementsNoBest}
                  </Text>
                </Glass>
              ))}
            </View>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={80}>
            <Section title={a.longestStreaks}>
              {[
                [a.waterLabel, data.longestStreaks.water],
                [a.stepsLabel, data.longestStreaks.steps],
                [a.sleepLabel, data.longestStreaks.sleep],
                [a.checkInLabel, data.longestStreaks.checkIn],
              ].map(([label, days], i) => (
                <React.Fragment key={String(label)}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.streakRow}>
                    <Text style={[T.body, { color: c.text, flex: 1 }]}>{label}</Text>
                    <Text style={[T.body, { color: c.muted }]}>{a.daysN.replace('{n}', String(days))}</Text>
                  </View>
                </React.Fragment>
              ))}
            </Section>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={120}>
            <Section title={a.badgesTitle}>
              {badges.map((badge, i) => (
                <React.Fragment key={badge.id}>
                  {i > 0 ? <Divider /> : null}
                  <BadgeRow badge={badge} />
                </React.Fragment>
              ))}
            </Section>
            <Text style={[T.fine, { color: c.faint, marginTop: 10, marginHorizontal: 2 }]}>{a.achievementsNote}</Text>
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 2 },
  streakRow: { flexDirection: 'row', alignItems: 'center' },
});
