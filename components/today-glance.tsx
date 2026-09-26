// The dashboard's overview card: four small rings (steps, water, sleep and the latest
// mood) with a line saying how many goals are met today. Each ring opens its page.
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { ProgressRing } from '@/components/steps-ring';
import { WATER_COLOR, SLEEP_COLOR } from '@/components/habit-art';
import { MoodFace, scoreTone } from '@/components/mood-art';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import type { AuthUser } from '@/graphql/auth';
import type { CheckIn } from '@/graphql/checkin';

const RING = 64;
const STROKE = 7;

const short = (n: number): string => (n >= 10_000 ? `${Math.round(n / 1000)}k` : n.toLocaleString());

function GlanceRing({
  label,
  value,
  progress,
  from,
  to,
  href,
  children,
}: {
  label: string;
  value: string;
  progress: number;
  from: string;
  to: string;
  href: Href;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.ring, { opacity: pressed ? 0.7 : 1 }]}
    >
      <ProgressRing progress={progress} size={RING} stroke={STROKE} from={from} to={to} label={`${label}: ${value}`}>
        {children}
      </ProgressRing>
      <Text style={[styles.value, { color: c.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[T.fine, { color: c.faint, fontSize: 11 }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TodayGlance({
  user,
  steps,
  water,
  sleep,
  mood,
}: {
  user: AuthUser;
  steps: number;
  water: number;
  sleep: number;
  mood: CheckIn | null;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];

  const met = [
    user.stepGoal > 0 && steps >= user.stepGoal,
    user.waterGoalGlasses > 0 && water >= user.waterGoalGlasses,
    user.sleepGoalHours > 0 && sleep >= user.sleepGoalHours,
  ].filter(Boolean).length;
  const summary = met === 3 ? a.goalsAllMet : met === 0 ? a.goalsNone : a.goalsMet.replace('{n}', String(met));
  const tone = mood ? scoreTone(mood.mood) : c.faint;

  return (
    <Glass style={{ padding: 16 }}>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: met === 3 ? `${c.success}22` : c.track }]}>
          <MaterialCommunityIcons
            name={met === 3 ? 'trophy' : 'flag-checkered'}
            size={15}
            color={met === 3 ? c.success : c.primary}
          />
        </View>
        <Text style={[T.body, { color: c.text, flex: 1, fontFamily: font.bodySemi }]} numberOfLines={2}>
          {summary}
        </Text>
        <Text style={[T.fine, { color: c.faint }]}>{met}/3</Text>
      </View>

      <View style={styles.rings}>
        <GlanceRing
          label={a.stepsLabel}
          value={short(steps)}
          progress={user.stepGoal > 0 ? steps / user.stepGoal : 0}
          from={c.primary}
          to={c.successMark}
          href="/(app)/steps"
        >
          <MaterialCommunityIcons name="shoe-print" size={20} color={c.primary} />
        </GlanceRing>
        <GlanceRing
          label={a.waterLabel}
          value={`${water.toLocaleString()}/${user.waterGoalGlasses}`}
          progress={user.waterGoalGlasses > 0 ? water / user.waterGoalGlasses : 0}
          from={WATER_COLOR}
          to="#5CC8F5"
          href="/(app)/water"
        >
          <MaterialCommunityIcons name="cup-water" size={20} color={WATER_COLOR} />
        </GlanceRing>
        <GlanceRing
          label={a.sleepLabel}
          value={`${sleep.toLocaleString()} h`}
          progress={user.sleepGoalHours > 0 ? sleep / user.sleepGoalHours : 0}
          from={SLEEP_COLOR}
          to="#4C8DF6"
          href="/sleep"
        >
          <MaterialCommunityIcons name="power-sleep" size={20} color={SLEEP_COLOR} />
        </GlanceRing>
        <GlanceRing
          label={a.moodName}
          value={mood ? a.moodWords[mood.mood - 1] : '–'}
          progress={mood ? mood.mood / 5 : 0}
          from={tone}
          to={tone}
          href="/checkin"
        >
          {mood ? (
            <MoodFace score={mood.mood} size={26} />
          ) : (
            <MaterialCommunityIcons name="emoticon-outline" size={22} color={c.faint} />
          )}
        </GlanceRing>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rings: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  ring: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontFamily: font.bodySemi, fontSize: 13, marginTop: 2 },
});
