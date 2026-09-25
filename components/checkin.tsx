// Daily check-in UI: the 1–5 mood and energy pickers, the dashboard tile, and the hooks
// that read and change check-ins.
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { usePressScale } from '@/components/motion';
import { streakText } from '@/components/habits';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import {
  CHECK_IN_SUMMARY,
  DELETE_CHECK_IN,
  LOG_CHECK_IN,
  type CheckIn,
  type CheckInSummary,
} from '@/graphql/checkin';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
export type ScoreKind = 'mood' | 'energy';

export const MOOD_COLOR = '#E8A33D';
export const ENERGY_COLOR = '#2BA89A';

// One icon per score, 1 to 5.
const ICONS: Record<ScoreKind, IconName[]> = {
  mood: [
    'emoticon-cry-outline',
    'emoticon-sad-outline',
    'emoticon-neutral-outline',
    'emoticon-happy-outline',
    'emoticon-excited-outline',
  ],
  energy: ['battery-10', 'battery-30', 'battery-50', 'battery-80', 'battery'],
};

export const scoreIcon = (kind: ScoreKind, score: number): IconName =>
  ICONS[kind][Math.min(5, Math.max(1, Math.round(score))) - 1];

export const scoreColor = (kind: ScoreKind): string => (kind === 'mood' ? MOOD_COLOR : ENERGY_COLOR);

/** An average such as 3.4 shown as "3.4 / 5", or a dash when there is none. */
export const formatAverage = (value: number | null): string =>
  value == null ? '–' : `${value.toLocaleString()} / 5`;

const REFETCH = ['CheckInSummary', 'CheckInHistory'];

/** Today's check-in, the streak and the averages. */
export function useCheckInSummary() {
  return useQuery<{ checkInSummary: CheckInSummary }>(CHECK_IN_SUMMARY);
}

/** Saves today's check-in. The summary and history refresh after. */
export function useLogCheckIn() {
  const [mutate, { loading }] = useMutation<{ logCheckIn: CheckIn }>(LOG_CHECK_IN, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
  const save = useCallback(
    (input: { mood: number; energy: number; note: string }) => mutate({ variables: { input } }),
    [mutate],
  );
  return { save, saving: loading };
}

/** Removes today's check-in. */
export function useDeleteCheckIn() {
  const [mutate, { loading }] = useMutation<{ deleteCheckIn: boolean }>(DELETE_CHECK_IN, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
  const remove = useCallback(() => mutate({ variables: {} }), [mutate]);
  return { remove, removing: loading };
}

/** Five round choices for one score, with the chosen one's word beneath. */
export function ScorePicker({
  kind,
  value,
  onChange,
}: {
  kind: ScoreKind;
  value: number | null;
  onChange: (score: number) => void;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const words = kind === 'mood' ? a.moodWords : a.energyWords;
  const tint = scoreColor(kind);

  return (
    <View style={{ gap: 10 }}>
      <Text style={[T.label, { color: c.faint }]}>{kind === 'mood' ? a.moodLabel : a.energyLabel}</Text>
      <View style={styles.choices} accessibilityRole="radiogroup">
        {ICONS[kind].map((icon, i) => {
          const score = i + 1;
          const on = value === score;
          return (
            <Pressable
              key={icon}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(score);
              }}
              accessibilityRole="radio"
              accessibilityLabel={words[i]}
              accessibilityState={{ selected: on }}
              hitSlop={4}
              style={({ pressed }) => [
                styles.choice,
                {
                  borderColor: on ? tint : c.border,
                  backgroundColor: on ? `${tint}22` : c.field,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons name={icon} size={28} color={on ? tint : c.faint} />
            </Pressable>
          );
        })}
      </View>
      <Text style={[T.fine, { color: value ? c.text : c.faint, textAlign: 'center' }]}>
        {value ? words[value - 1] : ' '}
      </Text>
    </View>
  );
}

/** Today's check-in on the dashboard, or a prompt to do it. Opens the check-in page. */
export function CheckInTile({ summary }: { summary?: CheckInSummary }) {
  const router = useRouter();
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const press = usePressScale(0.97);
  const today = summary?.today ?? null;

  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={() => router.push('/(app)/checkin')}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={a.checkInLabel}
        accessibilityHint={a.openDetails}
      >
        <Glass style={{ padding: 16 }}>
          <View style={styles.tileHead}>
            <View style={[styles.tileIcon, { backgroundColor: c.track }]}>
              <MaterialCommunityIcons name="heart-pulse" size={16} color={MOOD_COLOR} />
            </View>
            <Text style={[T.label, { color: c.faint, flex: 1 }]} numberOfLines={1}>
              {a.checkInLabel.toUpperCase()}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={c.faint} />
          </View>

          {today ? (
            <View style={styles.tileBody}>
              <View style={styles.tileScores}>
                <MaterialCommunityIcons name={scoreIcon('mood', today.mood)} size={40} color={MOOD_COLOR} />
                <MaterialCommunityIcons name={scoreIcon('energy', today.energy)} size={34} color={ENERGY_COLOR} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: font.displayBold, fontSize: 20, color: c.text }} numberOfLines={1}>
                  {a.moodWords[today.mood - 1]}
                </Text>
                <Text style={[T.fine, { color: c.muted }]} numberOfLines={1}>
                  {a.energyWords[today.energy - 1]}
                </Text>
                <Text style={[T.fine, { color: c.faint }]} numberOfLines={1}>
                  {streakText(summary?.streak ?? 0, a)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.tileBody, { alignItems: 'flex-start' }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: font.displayBold, fontSize: 18, color: c.text }}>
                  {a.checkInPrompt}
                </Text>
                <Text style={[T.fine, { color: c.muted }]}>{a.checkInPromptSub}</Text>
                {summary?.streak ? (
                  <Text style={[T.fine, { color: c.faint }]}>{streakText(summary.streak, a)}</Text>
                ) : null}
              </View>
              <View style={[styles.cta, { backgroundColor: c.primary }]}>
                <Text style={[T.button, { color: c.onPrimary }]}>{a.checkInCta}</Text>
              </View>
            </View>
          )}
        </Glass>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  choice: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 60,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  tileIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  tileScores: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cta: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
});
