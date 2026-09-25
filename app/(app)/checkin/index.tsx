// Check-in: today's mood, energy and note, the streak and averages, and the last 30 days.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { ErrorNote, Field, LinkText, PrimaryButton, QuietButton } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section, Divider, FactRow } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { useNotice } from '@/components/notice';
import { dayLabel } from '@/components/habits';
import {
  ENERGY_COLOR,
  MOOD_COLOR,
  ScorePicker,
  formatAverage,
  scoreIcon,
  useCheckInSummary,
  useDeleteCheckIn,
  useLogCheckIn,
} from '@/components/checkin';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { CHECK_IN_HISTORY, CHECK_IN_LIMITS, type CheckIn } from '@/graphql/checkin';

export default function CheckInScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const notice = useNotice();
  const a = APP_COPY[lang];

  const summaryQuery = useCheckInSummary();
  const historyQuery = useQuery<{ checkInHistory: CheckIn[] }>(CHECK_IN_HISTORY, { variables: { days: 30 } });
  const { save, saving } = useLogCheckIn();
  const { remove, removing } = useDeleteCheckIn();

  const summary = summaryQuery.data?.checkInSummary;
  const today = summary?.today ?? null;
  const history = historyQuery.data?.checkInHistory ?? [];

  // The user's edits; until they change something, the form shows today's saved check-in.
  const [draft, setDraft] = useState<{ mood: number | null; energy: number | null; note: string } | null>(null);
  const saved = { mood: today?.mood ?? null, energy: today?.energy ?? null, note: today?.note ?? '' };
  const { mood, energy, note } = draft ?? saved;
  const edit = (change: Partial<typeof saved>) => setDraft({ ...(draft ?? saved), ...change });

  const onSave = () => {
    if (mood == null || energy == null) {
      notice.failure(a.checkInLabel, a.pickBoth);
      return;
    }
    save({ mood, energy, note: note.trim() })
      .then(() => {
        setDraft(null);
        notice.success(a.checkInSaved);
      })
      .catch((e: unknown) => notice.failure(a.checkInLabel, errorMessage(e, lang)));
  };

  const onRemove = () => {
    Alert.alert(a.checkInRemoveConfirm, undefined, [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.remove,
        style: 'destructive',
        onPress: () => {
          remove()
            .then(() => {
              setDraft(null);
              notice.success(a.checkInRemoved);
            })
            .catch((e: unknown) => notice.failure(a.checkInLabel, errorMessage(e, lang)));
        },
      },
    ]);
  };

  const changed = mood !== saved.mood || energy !== saved.energy || note.trim() !== saved.note;
  const streak = summary?.streak ?? 0;

  return (
    <Screen
      onRefresh={() => Promise.all([summaryQuery.refetch(), historyQuery.refetch()])}
      header={<AppHeader title={a.checkInLabel} subtitle={a.checkInSub} backLabel={t.back} onBack={() => router.back()} />}
    >
      <FadeIn>
        <Glass style={{ padding: 20 }}>
          <View style={{ gap: 18 }}>
            <Text style={[T.label, { color: c.faint }]}>{a.habitsToday}</Text>
            <ScorePicker kind="mood" value={mood} onChange={(value) => edit({ mood: value })} />
            <ScorePicker kind="energy" value={energy} onChange={(value) => edit({ energy: value })} />
            <Field
              label={a.checkInNote}
              value={note}
              onChangeText={(value) => edit({ note: value })}
              placeholder={a.checkInNotePlaceholder}
              maxLength={CHECK_IN_LIMITS.note}
              multiline
              textAlignVertical="top"
              style={styles.note}
            />
            <PrimaryButton
              label={today ? a.checkInUpdate : a.checkInSave}
              onPress={onSave}
              busy={saving}
              disabled={today ? !changed : mood == null || energy == null}
            />
            {today ? (
              <View style={{ alignItems: 'center' }}>
                <LinkText label={a.checkInRemove} onPress={removing ? () => {} : onRemove} />
              </View>
            ) : null}
          </View>
        </Glass>
      </FadeIn>

      {summary ? (
        <>
          <Gap h={18} />
          <FadeIn delay={60}>
            <View style={styles.statsRow}>
              <Glass style={styles.statCard}>
                <MiniStat
                  icon="fire"
                  value={String(streak)}
                  caption={a.streakLabel}
                  tint={streak > 0 ? '#E8772E' : c.faint}
                />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat
                  icon={scoreIcon('mood', summary.week.mood ?? 3)}
                  value={formatAverage(summary.week.mood)}
                  caption={a.moodAverage}
                  tint={MOOD_COLOR}
                />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat
                  icon={scoreIcon('energy', summary.week.energy ?? 3)}
                  value={formatAverage(summary.week.energy)}
                  caption={a.energyAverage}
                  tint={ENERGY_COLOR}
                />
              </Glass>
            </View>
          </FadeIn>
          <Gap h={18} />
          <FadeIn delay={110}>
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
          <FadeIn delay={160}>
            <Section title={a.checkInHistory}>
              {history.length ? (
                history.map((entry, i) => (
                  <React.Fragment key={entry.day}>
                    {i > 0 ? <Divider /> : null}
                    <View style={{ gap: 4 }}>
                      <View style={styles.historyRow}>
                        <Text style={[T.body, { color: c.text, flex: 1 }]}>
                          {entry.day === today?.day ? a.dayToday : dayLabel(entry.day, lang)}
                        </Text>
                        <MaterialCommunityIcons
                          name={scoreIcon('mood', entry.mood)}
                          size={22}
                          color={MOOD_COLOR}
                          accessibilityLabel={a.moodWords[entry.mood - 1]}
                        />
                        <MaterialCommunityIcons
                          name={scoreIcon('energy', entry.energy)}
                          size={22}
                          color={ENERGY_COLOR}
                          style={{ marginLeft: 10 }}
                          accessibilityLabel={a.energyWords[entry.energy - 1]}
                        />
                      </View>
                      {entry.note ? (
                        <Text style={[T.fine, { color: c.muted }]} numberOfLines={3}>
                          {entry.note}
                        </Text>
                      ) : null}
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

const styles = StyleSheet.create({
  note: { height: undefined, minHeight: 96, paddingTop: 14, paddingBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
});
