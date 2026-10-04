// Achievements UI: the hook that reads them, the words for each badge, one badge row with its
// progress or earned date, and the dashboard card that opens the achievements page.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { NavRow } from '@/components/panel';
import { WATER_COLOR, SLEEP_COLOR } from '@/components/habit-art';
import { dateText } from '@/components/cycle';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font, radius } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import { ACHIEVEMENTS, type Achievements, type Badge } from '@/graphql/achievements';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Badges and personal bests. */
export function useAchievements() {
  return useQuery<{ achievements: Achievements }>(ACHIEVEMENTS);
}

/** The badge's title and how to earn it, in the app's language. */
export const badgeText = (badge: Badge, a: AppCopy): { title: string; detail: string } => {
  const n = String(badge.target);
  if (badge.kind === 'FIRST_CHECKIN') return { title: a.badgeFirstCheckIn, detail: a.badgeFirstCheckInDetail };
  if (badge.kind === 'FIRST_WEEK') return { title: a.badgeFirstWeek, detail: a.badgeFirstWeekDetail };
  if (badge.kind === 'WEIGHT_GOAL') return { title: a.badgeWeightGoal, detail: a.badgeWeightGoalDetail };
  const [title, detail] = {
    WATER: [a.badgeWaterStreak, a.badgeWaterStreakDetail],
    STEPS: [a.badgeStepsStreak, a.badgeStepsStreakDetail],
    SLEEP: [a.badgeSleepStreak, a.badgeSleepStreakDetail],
    CHECKIN: [a.badgeCheckInStreak, a.badgeCheckInStreakDetail],
  }[badge.metric ?? 'CHECKIN'];
  return { title: title.replace('{n}', n), detail: detail.replace('{n}', n) };
};

const useBadgeLook = (badge: Badge): { icon: IconName; tint: string } => {
  const { c } = useTheme();
  if (badge.kind === 'FIRST_CHECKIN') return { icon: 'emoticon-happy-outline', tint: c.primary };
  if (badge.kind === 'FIRST_WEEK') return { icon: 'calendar-check', tint: c.primary };
  if (badge.kind === 'WEIGHT_GOAL') return { icon: 'flag-checkered', tint: c.primary };
  return {
    WATER: { icon: 'cup-water' as IconName, tint: WATER_COLOR },
    STEPS: { icon: 'walk' as IconName, tint: c.primary },
    SLEEP: { icon: 'power-sleep' as IconName, tint: SLEEP_COLOR },
    CHECKIN: { icon: 'heart-pulse' as IconName, tint: c.primary },
  }[badge.metric ?? 'CHECKIN'];
};

/** One badge: its icon (coloured once earned), title, how to earn it, and the earned date or progress. */
export function BadgeRow({ badge }: { badge: Badge }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const { title, detail } = badgeText(badge, a);
  const { icon, tint } = useBadgeLook(badge);
  const share = badge.target > 0 ? badge.progress / badge.target : 0;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: badge.earned ? `${tint}26` : c.track }]}>
        <MaterialCommunityIcons name={badge.earned ? icon : 'lock-outline'} size={20} color={badge.earned ? tint : c.faint} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[T.body, { color: c.text, fontFamily: font.bodySemi }]}>{title}</Text>
        <Text style={[T.fine, { color: c.faint }]}>{detail}</Text>
        {badge.earned ? (
          badge.earnedOn ? (
            <Text style={[T.fine, { color: c.success }]}>{a.badgeEarnedOn.replace('{date}', dateText(badge.earnedOn, lang))}</Text>
          ) : (
            <Text style={[T.fine, { color: c.success }]}>{a.badgeEarned}</Text>
          )
        ) : badge.target > 1 ? (
          <View style={styles.progress}>
            <View style={[styles.track, { backgroundColor: c.track }]}>
              <View style={[styles.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: tint }]} />
            </View>
            <Text style={[T.fine, { color: c.muted }]}>
              {badge.progress} / {badge.target}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** The dashboard's link to the achievements page, with how many badges are earned. */
export function AchievementsCard({ achievements }: { achievements?: Achievements }) {
  const router = useRouter();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const hint = achievements
    ? a.achievementsEarned
        .replace('{n}', String(achievements.earnedCount))
        .replace('{total}', String(achievements.badges.length))
    : a.achievementsCardEmpty;

  return (
    <Glass style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
      <NavRow label={a.achievementsTitle} hint={hint} onPress={() => router.push('/(app)/achievements')} />
    </Glass>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  track: { flex: 1, height: 6, borderRadius: radius.chip, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.chip },
});
