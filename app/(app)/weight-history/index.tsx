// Weight chart: log today's weight, see it over 30, 90 or 365 days as a line over the real dates,
// the current weight and the change over the range, and the logged weights with remove.
// Opened from the profile page.
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ChoiceRow, ErrorNote, Field, PrimaryButton, QuietButton } from '@/components/ui';
import { Divider, Section } from '@/components/panel';
import { Pressable } from '@/components/pressable';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat } from '@/components/steps-ring';
import { useNotice } from '@/components/notice';
import { addDays, dateText } from '@/components/cycle';
import { TrendLineChart } from '@/components/trend-line';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { localDay } from '@/lib/steps';
import { DELETE_WEIGHT, LOG_WEIGHT, WEIGHT_HISTORY, WEIGHT_LIMITS, type WeightEntry } from '@/graphql/weight';

type Range = '30' | '90' | '365';
const RANGES: Range[] = ['30', '90', '365'];

/** "70.5 kg" */
const kgText = (kg: number): string => `${(Math.round(kg * 10) / 10).toLocaleString()} kg`;

/** "+1.2 kg" / "−0.8 kg" / "0 kg" */
const kgChange = (diff: number): string => {
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return '0 kg';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toLocaleString()} kg`;
};

// "70,5" or "70.5" as a number; NaN when it is not one.
const parseKg = (raw: string): number => {
  const text = raw.trim().replace(',', '.');
  return /^\d{1,3}(\.\d{1,2})?$/.test(text) ? Number(text) : Number.NaN;
};

export default function WeightHistoryScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, refreshUser } = useSession();
  const notice = useNotice();
  const a = APP_COPY[lang];
  const today = localDay();
  const [range, setRange] = useState<Range>('90');
  const count = Number(range);

  const query = useQuery<{ weightHistory: WeightEntry[] }>(WEIGHT_HISTORY, { variables: { days: count } });
  const refetch = { refetchQueries: ['WeightHistory'], awaitRefetchQueries: true };
  const [logWeight, logging] = useMutation(LOG_WEIGHT, refetch);
  const [deleteWeight] = useMutation(DELETE_WEIGHT, refetch);

  const [text, setText] = useState(user?.weightKg != null ? String(user.weightKg) : '');
  const kg = parseKg(text);
  const invalid = text.trim() !== '' && (Number.isNaN(kg) || kg < WEIGHT_LIMITS.min || kg > WEIGHT_LIMITS.max);

  const entries = useMemo(() => [...(query.data?.weightHistory ?? [])].reverse(), [query.data]);

  if (!user) return <Screen />;

  const from = addDays(today, -(count - 1));
  const latest = entries[entries.length - 1];
  const first = entries[0];

  const save = () => {
    if (invalid || Number.isNaN(kg)) return;
    logWeight({ variables: { input: { kg } } })
      .then(() => {
        notice.success(a.weightSaved, kgText(kg));
        void refreshUser();
      })
      .catch((e: unknown) => notice.failure(a.weightChartTitle, errorMessage(e, lang)));
  };

  const remove = (day: string) =>
    Alert.alert(a.weightRemoveConfirm, dateText(day, lang, true), [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.remove,
        style: 'destructive',
        onPress: () => {
          deleteWeight({ variables: { day } })
            .then(() => void refreshUser())
            .catch((e: unknown) => notice.failure(a.weightChartTitle, errorMessage(e, lang)));
        },
      },
    ]);

  return (
    <Screen
      onRefresh={() => query.refetch()}
      header={
        <AppHeader title={a.weightChartTitle} subtitle={a.weightChartSub} backLabel={t.back} onBack={() => router.back()} />
      }
    >
      <FadeIn>
        <Section title={a.logWeightTitle}>
          <Field
            label={a.weightTodayLabel}
            value={text}
            onChangeText={setText}
            keyboardType="decimal-pad"
            placeholder="70"
            maxLength={6}
            errorText={invalid ? a.outOfRange : undefined}
          />
          <Text style={[T.fine, { color: c.faint }]}>{a.weightHint}</Text>
          <PrimaryButton label={a.save} onPress={save} busy={logging.loading} disabled={invalid || Number.isNaN(kg)} />
        </Section>
      </FadeIn>

      <Gap h={18} />
      <FadeIn delay={40}>
        <ChoiceRow
          label={a.chartRange}
          options={RANGES.map((value) => ({ value, label: a.daysN.replace('{n}', value) }))}
          value={range}
          onChange={setRange}
        />
      </FadeIn>

      {query.error && !query.data ? (
        <>
          <Gap h={18} />
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void query.refetch()} />
        </>
      ) : null}

      {query.data ? (
        <>
          <Gap h={18} />
          <FadeIn delay={80}>
            <View style={styles.stats}>
              <Glass style={styles.statCard}>
                <MiniStat icon="scale-bathroom" value={latest ? kgText(latest.kg) : '–'} caption={a.weightCurrent} tint={c.primary} />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat
                  icon="swap-vertical"
                  value={latest && first && latest !== first ? kgChange(latest.kg - first.kg) : '–'}
                  caption={a.weightChange}
                  tint={c.primary}
                />
              </Glass>
              <Glass style={styles.statCard}>
                <MiniStat icon="format-list-numbered" value={String(entries.length)} caption={a.weightEntries} tint={c.primary} />
              </Glass>
            </View>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={120}>
            <Section title={a.daysN.replace('{n}', range).toUpperCase()}>
              {entries.length ? (
                <TrendLineChart
                  key={range}
                  points={entries.map((e) => ({ day: e.day, value: e.kg }))}
                  from={from}
                  to={today}
                  color={c.primary}
                  format={kgText}
                  change={kgChange}
                />
              ) : (
                <Text style={[T.fine, { color: c.faint }]}>{a.weightEmpty}</Text>
              )}
            </Section>
          </FadeIn>

          {entries.length ? (
            <>
              <Gap h={18} />
              <FadeIn delay={160}>
                <Section title={a.weightHistoryTitle}>
                  {[...entries].reverse().map((entry, i, list) => {
                    const before = list[i + 1];
                    return (
                      <React.Fragment key={entry.day}>
                        {i > 0 ? <Divider /> : null}
                        <View style={styles.row}>
                          <View style={{ flex: 1 }}>
                            <Text style={[T.body, { color: c.text }]}>
                              {entry.day === today ? a.dayToday : dateText(entry.day, lang, true)}
                            </Text>
                            {before ? (
                              <Text style={[T.fine, { color: c.faint }]}>{kgChange(entry.kg - before.kg)}</Text>
                            ) : null}
                          </View>
                          <Text style={[T.body, { color: c.text, marginRight: 14 }]}>{kgText(entry.kg)}</Text>
                          <Pressable
                            ripple="borderless"
                            onPress={() => remove(entry.day)}
                            accessibilityRole="button"
                            accessibilityLabel={a.remove}
                            hitSlop={10}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.faint} />
                          </Pressable>
                        </View>
                      </React.Fragment>
                    );
                  })}
                </Section>
              </FadeIn>
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
