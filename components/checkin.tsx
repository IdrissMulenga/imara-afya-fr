// Daily check-in UI: the 1–5 mood and energy pickers, the interactive dashboard card,
// and the hooks that read and change check-ins.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { EnergyBattery, MoodFace, scoreTone } from '@/components/mood-art';
import { useNotice } from '@/components/notice';
import { streakText } from '@/components/habits';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, type AppCopy, type MoodBand } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import {
  CHECK_IN_LIMITS,
  CHECK_IN_SUMMARY,
  DELETE_CHECK_IN,
  LOG_CHECK_IN,
  type CheckIn,
  type CheckInSummary,
} from '@/graphql/checkin';

export type ScoreKind = 'mood' | 'energy';

const SCORES = [1, 2, 3, 4, 5] as const;

/** The face or battery for a score. `dim` fades it; `animate` makes it move. */
export function ScoreArt({
  kind,
  score,
  size,
  animate = false,
  dim = false,
}: {
  kind: ScoreKind;
  score: number;
  size: number;
  animate?: boolean;
  dim?: boolean;
}) {
  return kind === 'mood' ? (
    <MoodFace score={score} size={size} animate={animate} dim={dim} />
  ) : (
    <EnergyBattery score={score} size={size} animate={animate} dim={dim} />
  );
}

const band = (score: number): MoodBand => (score <= 2 ? 'low' : score >= 4 ? 'high' : 'mid');

/** A warm message for today's mood and energy. */
export const warmMessage = (mood: number, energy: number, a: AppCopy): string =>
  a.moodMessages[band(mood)][band(energy)];

/** True when at least 3 check-ins this week average a low mood (2 or below). */
export const lowMoodWeek = (summary?: CheckInSummary): boolean =>
  !!summary && summary.week.count >= 3 && summary.week.mood != null && summary.week.mood <= 2;

/** The warm message in a soft card tinted by the mood, plus a gentle support note
 *  after a low week. */
export function WarmMessage({ mood, energy, summary }: { mood: number; energy: number; summary?: CheckInSummary }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const tone = scoreTone(mood);

  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.message, { backgroundColor: `${tone}1F`, borderColor: `${tone}55` }]}>
        <MaterialCommunityIcons name="heart" size={16} color={tone} style={{ marginTop: 2 }} />
        <Text style={[T.body, { color: c.text, flex: 1 }]}>{warmMessage(mood, energy, a)}</Text>
      </View>
      {lowMoodWeek(summary) ? (
        <View style={[styles.message, { backgroundColor: c.track, borderColor: c.border }]}>
          <MaterialCommunityIcons name="hand-heart" size={16} color={c.primary} style={{ marginTop: 2 }} />
          <Text style={[T.fine, { color: c.muted, flex: 1 }]}>{a.moodSupport}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** An average such as 3.4 shown as "3.4 / 5", or a dash when there is none. */
export const formatAverage = (value: number | null): string => (value == null ? '–' : `${value.toLocaleString()} / 5`);

const REFETCH = ['CheckInSummary', 'CheckInHistory'];

/** Today's check-ins, the latest one, the streak and the averages. */
export function useCheckInSummary() {
  return useQuery<{ checkInSummary: CheckInSummary }>(CHECK_IN_SUMMARY);
}

/** Logs a new check-in now. The summary and history refresh after. */
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

/** Removes one check-in. */
export function useDeleteCheckIn() {
  const [mutate, { loading }] = useMutation<{ deleteCheckIn: boolean }>(DELETE_CHECK_IN, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
  const remove = useCallback((id: string) => mutate({ variables: { id } }), [mutate]);
  return { remove, removing: loading };
}

// One row of five small faces or batteries on the dashboard card; tapping one picks it.
function QuickRow({
  kind,
  value,
  disabled,
  onPick,
}: {
  kind: ScoreKind;
  value: number | null;
  disabled: boolean;
  onPick: (score: number) => void;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const words = kind === 'mood' ? a.moodWords : a.energyWords;

  return (
    <View style={{ gap: 6 }}>
      <Text style={[T.label, { color: c.faint }]}>{kind === 'mood' ? a.moodLabel : a.energyLabel}</Text>
      <View style={styles.quickRow} accessibilityRole="radiogroup">
        {SCORES.map((score) => {
          const on = value === score;
          return (
            <Pressable
              key={score}
              disabled={disabled}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onPick(score);
              }}
              accessibilityRole="radio"
              accessibilityLabel={words[score - 1]}
              accessibilityState={{ selected: on, disabled }}
              hitSlop={4}
              style={({ pressed }) => [
                styles.quickChoice,
                on ? { backgroundColor: `${scoreTone(score)}26` } : null,
                pressed ? { opacity: 0.6 } : null,
              ]}
            >
              <ScoreArt kind={kind} score={score} size={34} animate={on} dim={value != null && !on} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** "{n} check-ins today", or the singular. */
export const checkInsTodayText = (n: number, a: AppCopy): string =>
  n === 1 ? a.checkInsTodayOne : a.checkInsToday.replace('{n}', String(n));

/** Dashboard check-in: quick mood and energy picks for the first one today, then the
 *  latest one with "Check in again", which opens the step-by-step check-in. */
export function CheckInCard({ summary }: { summary?: CheckInSummary }) {
  const router = useRouter();
  const { c } = useTheme();
  const { lang } = useLang();
  const notice = useNotice();
  const a = APP_COPY[lang];
  const { save, saving } = useLogCheckIn();

  const latest = summary?.latest ?? null;
  const count = summary?.today.length ?? 0;
  // Choices for the check-in being made, not saved yet.
  const [pick, setPick] = useState<{ mood: number | null; energy: number | null }>({ mood: null, energy: null });

  const picking = !latest && !saving;
  const shown = picking || saving ? pick : { mood: latest?.mood ?? null, energy: latest?.energy ?? null };
  const { mood, energy } = shown;

  const choose = (kind: ScoreKind, score: number) => {
    const next = { ...pick, [kind]: score };
    setPick(next);
    if (next.mood == null || next.energy == null) return;
    save({ mood: next.mood, energy: next.energy, note: '' })
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        notice.success(a.checkInSaved);
      })
      .catch((e: unknown) => notice.failure(a.checkInLabel, errorMessage(e, lang)))
      .finally(() => setPick({ mood: null, energy: null }));
  };

  const streak = summary?.streak ?? 0;
  const canAddMore = !!latest && !saving && count < CHECK_IN_LIMITS.perDay;

  return (
    <Glass style={{ padding: 16 }}>
      <View style={styles.tileHead}>
        <View style={[styles.tileIcon, { backgroundColor: c.track }]}>
          <MaterialCommunityIcons name="heart-pulse" size={16} color={mood ? scoreTone(mood) : c.primary} />
        </View>
        <Text style={[T.label, { color: c.faint, flex: 1 }]} numberOfLines={1}>
          {a.checkInLabel.toUpperCase()}
        </Text>
        <Pressable
          onPress={() => router.push('/checkin')}
          accessibilityRole="button"
          accessibilityLabel={a.checkInDetails}
          hitSlop={10}
          style={({ pressed }) => [styles.details, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[T.fine, { color: c.primary, fontFamily: font.bodySemi }]}>{a.checkInDetails}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={c.primary} />
        </Pressable>
      </View>

      {mood != null && energy != null && !picking ? (
        <>
          <View style={styles.hero}>
            <MoodFace score={mood} size={60} />
            <EnergyBattery score={energy} size={54} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: font.displayBold, fontSize: 20, color: scoreTone(mood) }} numberOfLines={1}>
                {a.moodWords[mood - 1]}
              </Text>
              <Text style={[T.fine, { color: scoreTone(energy), fontFamily: font.bodySemi }]} numberOfLines={1}>
                {a.energyWords[energy - 1]}
              </Text>
              <Text style={[T.fine, { color: c.faint }]} numberOfLines={1}>
                {saving ? a.saving : `${checkInsTodayText(count, a)} · ${streakText(streak, a)}`}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 14 }}>
            <WarmMessage mood={mood} energy={energy} summary={summary} />
          </View>
          {canAddMore ? (
            <Pressable
              onPress={() => router.push('/checkin-flow')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.again, { borderColor: c.border, opacity: pressed ? 0.6 : 1 }]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={c.primary} />
              <Text style={[T.button, { color: c.primary }]}>{a.checkInAgain}</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <View style={{ gap: 4, marginTop: 12 }}>
          <Text style={{ fontFamily: font.displayBold, fontSize: 18, color: c.text }}>{a.checkInPrompt}</Text>
          <Text style={[T.fine, { color: c.muted }]}>{a.checkInQuickHint}</Text>
          {streak && !latest ? <Text style={[T.fine, { color: c.faint }]}>{streakText(streak, a)}</Text> : null}
        </View>
      )}

      {picking ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          <QuickRow kind="mood" value={mood} disabled={saving} onPick={(score) => choose('mood', score)} />
          <QuickRow kind="energy" value={energy} disabled={saving} onPick={(score) => choose('energy', score)} />
        </View>
      ) : null}
    </Glass>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickChoice: {
    flex: 1,
    maxWidth: 54,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  tileIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  again: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  message: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
});
