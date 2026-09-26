// Check-in: a card that opens the step-by-step check-in (several a day), today's
// check-ins, the trend chart, the streak and averages, and the last 30 days.
import React from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { ErrorNote, PrimaryButton, QuietButton } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section, Divider, FactRow } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { useNotice } from '@/components/notice';
import { dayLabel } from '@/components/habits';
import { scoreTone } from '@/components/mood-art';
import { MoodTrend } from '@/components/mood-trend';
import {
  ScoreArt,
  WarmMessage,
  checkInsTodayText,
  formatAverage,
  useCheckInSummary,
  useDeleteCheckIn,
} from '@/components/checkin';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { localDay } from '@/lib/steps';
import { CHECK_IN_HISTORY, CHECK_IN_LIMITS, type CheckIn, type CheckInDay } from '@/graphql/checkin';

// "14:05" in the phone's local time.
const timeLabel = (at: string, lang: Lang): string => {
  try {
    return new Date(at).toLocaleTimeString(lang === 'rn' ? 'fr' : lang, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return at.slice(11, 16);
  }
};

export default function CheckInScreen() {
  const router = useRouter();
  const { lang } = useLang();
  const { c } = useTheme();
  const notice = useNotice();
  const a = APP_COPY[lang];

  const summaryQuery = useCheckInSummary();
  const historyQuery = useQuery<{ checkInHistory: CheckInDay[] }>(CHECK_IN_HISTORY, { variables: { days: 30 } });
  const { remove, removing } = useDeleteCheckIn();

  const summary = summaryQuery.data?.checkInSummary;
  const todays = summary?.today ?? [];
  const latest = summary?.latest ?? null;
  const history = historyQuery.data?.checkInHistory ?? [];
  const today = localDay();

  const full = todays.length >= CHECK_IN_LIMITS.perDay;

  const onRemove = (entry: CheckIn) => {
    Alert.alert(a.checkInRemoveOne, undefined, [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.remove,
        style: 'destructive',
        onPress: () => {
          remove(entry.id)
            .then(() => notice.success(a.checkInRemoved))
            .catch((e: unknown) => notice.failure(a.checkInLabel, errorMessage(e, lang)));
        },
      },
    ]);
  };

  const streak = summary?.streak ?? 0;

  return (
    <Screen
      onRefresh={() => Promise.all([summaryQuery.refetch(), historyQuery.refetch()])}
      header={<AppHeader title={a.checkInLabel} subtitle={a.checkInSub} />}
      tabbed
    >
      {latest ? (
        <FadeIn>
          <WarmMessage mood={latest.mood} energy={latest.energy} summary={summary} />
          <Gap h={18} />
        </FadeIn>
      ) : null}

      <FadeIn>
        <NewCheckInCard
          title={latest ? a.checkInAgain : a.checkInPrompt}
          full={full}
          onPress={() => router.push('/checkin-flow')}
        />
      </FadeIn>

      {todays.length ? (
        <>
          <Gap h={18} />
          <FadeIn delay={40}>
            <Section title={a.checkInTodayList}>
              <Text style={[T.fine, { color: c.faint }]}>{checkInsTodayText(todays.length, a)}</Text>
              {todays.map((entry) => (
                <React.Fragment key={entry.id}>
                  <Divider />
                  <EntryRow entry={entry} lang={lang} onRemove={removing ? undefined : () => onRemove(entry)} />
                </React.Fragment>
              ))}
            </Section>
          </FadeIn>
        </>
      ) : null}

      {historyQuery.data ? (
        <>
          <Gap h={18} />
          <FadeIn delay={80}>
            <MoodTrend days={history} today={today} />
          </FadeIn>
        </>
      ) : null}

      {summary ? (
        <>
          <Gap h={18} />
          <FadeIn delay={120}>
            <View style={styles.statsRow}>
              <Glass style={styles.statCard}>
                <MiniStat
                  icon="fire"
                  value={String(streak)}
                  caption={a.streakLabel}
                  tint={streak > 0 ? '#E8772E' : c.faint}
                />
              </Glass>
              <AverageCard kind="mood" value={summary.week.mood} caption={a.moodAverage} />
              <AverageCard kind="energy" value={summary.week.energy} caption={a.energyAverage} />
            </View>
          </FadeIn>
          <Gap h={18} />
          <FadeIn delay={150}>
            <Section title={a.last30Days}>
              <FactRow label={a.moodName} value={formatAverage(summary.month.mood)} />
              <FactRow label={a.energyName} value={formatAverage(summary.month.energy)} />
              <FactRow label={a.checkInDays} value={`${summary.month.count} / ${summary.month.days}`} />
            </Section>
          </FadeIn>
        </>
      ) : null}

      {historyQuery.error && !history.length ? (
        <>
          <Gap h={18} />
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void historyQuery.refetch()} />
        </>
      ) : null}

      {historyQuery.data ? (
        <>
          <Gap h={18} />
          <FadeIn delay={180}>
            <Section title={a.checkInHistory}>
              {history.length ? (
                history.map((day, i) => (
                  <React.Fragment key={day.day}>
                    {i > 0 ? <Divider /> : null}
                    <View style={{ gap: 8 }}>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={[T.body, { color: c.text }]}>
                            {day.day === today ? a.dayToday : dayLabel(day.day, lang)}
                          </Text>
                          <Text style={[T.fine, { color: c.faint }]}>
                            {day.entries.length > 1 ? `${day.entries.length} × · ` : ''}
                            {a.moodWords[Math.round(day.mood) - 1]}
                          </Text>
                        </View>
                        <View
                          style={styles.art}
                          accessible
                          accessibilityLabel={`${a.moodWords[Math.round(day.mood) - 1]}, ${a.energyWords[Math.round(day.energy) - 1]}`}
                        >
                          <ScoreArt kind="mood" score={day.mood} size={26} />
                          <ScoreArt kind="energy" score={day.energy} size={26} />
                        </View>
                      </View>
                      {day.entries.length > 1 || day.entries[0]?.note
                        ? day.entries.map((entry) => (
                            <EntryRow key={entry.id} entry={entry} lang={lang} compact />
                          ))
                        : null}
                    </View>
                  </React.Fragment>
                ))
              ) : (
                <Text style={[T.fine, { color: c.faint }]}>{a.noCheckIns}</Text>
              )}
            </Section>
          </FadeIn>
        </>
      ) : null}
    </Screen>
  );
}

// The card at the top: a question with a small face and battery, and the button that
// opens a new check-in (disabled at the daily limit).
function NewCheckInCard({ title, full, onPress }: { title: string; full: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  return (
    <Glass style={{ padding: 20 }}>
      <View style={styles.newRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: font.displayBold, fontSize: 20, color: c.text }}>{title}</Text>
          <Text style={[T.fine, { color: c.muted }]}>{a.checkInSub}</Text>
        </View>
        <View style={styles.art}>
          <ScoreArt kind="mood" score={4} size={40} animate />
          <ScoreArt kind="energy" score={4} size={40} animate />
        </View>
      </View>
      <View style={{ height: 16 }} />
      <PrimaryButton label={a.newCheckIn} onPress={onPress} disabled={full} />
    </Glass>
  );
}

// One check-in: its time, face and battery, note, and a remove button when allowed.
function EntryRow({
  entry,
  lang,
  compact = false,
  onRemove,
}: {
  entry: CheckIn;
  lang: Lang;
  compact?: boolean;
  onRemove?: () => void;
}) {
  const { c } = useTheme();
  const a = APP_COPY[lang];
  const size = compact ? 18 : 28;

  return (
    <View style={[styles.row, { alignItems: 'flex-start', paddingLeft: compact ? 8 : 0 }]}>
      <Text style={[compact ? T.fine : T.body, { color: c.muted, width: compact ? 48 : 56, fontFamily: font.bodySemi }]}>
        {timeLabel(entry.at, lang)}
      </Text>
      <View
        style={[styles.art, { gap: 6 }]}
        accessible
        accessibilityLabel={`${a.moodWords[entry.mood - 1]}, ${a.energyWords[entry.energy - 1]}`}
      >
        <ScoreArt kind="mood" score={entry.mood} size={size} />
        <ScoreArt kind="energy" score={entry.energy} size={size} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        {compact ? null : (
          <Text style={[T.fine, { color: scoreTone(entry.mood), fontFamily: font.bodySemi }]} numberOfLines={1}>
            {a.moodWords[entry.mood - 1]} · {a.energyWords[entry.energy - 1]}
          </Text>
        )}
        {entry.note ? (
          <Text style={[T.fine, { color: c.muted }]} numberOfLines={compact ? 2 : 4}>
            {entry.note}
          </Text>
        ) : null}
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={a.remove} hitSlop={10}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

// A 7-day average with its face or battery, coloured by the score.
function AverageCard({ kind, value, caption }: { kind: 'mood' | 'energy'; value: number | null; caption: string }) {
  const { c } = useTheme();
  return (
    <Glass style={styles.statCard}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        {value == null ? <View style={{ height: 26 }} /> : <ScoreArt kind={kind} score={value} size={26} animate />}
        <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: value == null ? c.faint : scoreTone(value) }}>
          {formatAverage(value)}
        </Text>
        <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]} numberOfLines={1}>
          {caption}
        </Text>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  newRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  art: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
