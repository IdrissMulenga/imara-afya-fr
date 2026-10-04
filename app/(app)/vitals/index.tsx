// Vitals: the newest blood pressure, blood sugar and pulse with how each is classed, the 7-day
// blood pressure average, a form to log a reading (with what to do about it, urgently when it
// needs care now), and the last 30 days of readings with remove. Opened from the profile page.
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { ChoiceRow, ErrorNote, Field, PrimaryButton, QuietButton } from '@/components/ui';
import { Divider, Section } from '@/components/panel';
import { Pressable } from '@/components/pressable';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { dateText } from '@/components/cycle';
import { AdviceBox, adviceText, categoryText, readingValue, useCategoryColor } from '@/components/vitals';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { enqueue, isOfflineError, newClientId } from '@/lib/offline-queue';
import { assessReading } from '@/lib/vital-rules';
import {
  DELETE_VITAL,
  LOG_VITAL,
  VITALS,
  VITAL_LIMITS,
  VITAL_SUMMARY,
  type GlucoseContext,
  type VitalKind,
  type VitalReading,
  type VitalSummary,
} from '@/graphql/vitals';

const KINDS: VitalKind[] = ['BLOOD_PRESSURE', 'GLUCOSE', 'PULSE'];
const CONTEXTS: GlucoseContext[] = ['FASTING', 'AFTER_MEAL', 'RANDOM'];
const HISTORY_DAYS = 30;

// A whole number from what was typed; NaN when it is not one.
const parseWhole = (raw: string): number => (/^\d{1,3}$/.test(raw.trim()) ? Number(raw.trim()) : Number.NaN);
// "6,2" or "6.2" as a number; NaN when it is not one.
const parseDecimal = (raw: string): number => {
  const text = raw.trim().replace(',', '.');
  return /^\d{1,2}(\.\d)?$/.test(text) ? Number(text) : Number.NaN;
};
const within = (value: number, [min, max]: readonly [number, number]) => value >= min && value <= max;

export default function VitalsScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const notice = useNotice();
  const a = APP_COPY[lang];
  const colorOf = useCategoryColor();

  const summaryQuery = useQuery<{ vitalSummary: VitalSummary }>(VITAL_SUMMARY);
  const historyQuery = useQuery<{ vitals: VitalReading[] }>(VITALS, { variables: { days: HISTORY_DAYS } });
  const refetch = { refetchQueries: ['VitalSummary', 'Vitals'], awaitRefetchQueries: true };
  const [logVital, logging] = useMutation<{ logVital: VitalReading }>(LOG_VITAL, refetch);
  const [deleteVital] = useMutation(DELETE_VITAL, refetch);

  const [kind, setKind] = useState<VitalKind>('BLOOD_PRESSURE');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [glucose, setGlucose] = useState('');
  const [context, setContext] = useState<GlucoseContext>('FASTING');
  const [saved, setSaved] = useState<VitalReading | null>(null);

  const summary = summaryQuery.data?.vitalSummary;
  const history = historyQuery.data?.vitals ?? [];

  // What was typed, checked against the same limits as the server.
  const sys = parseWhole(systolic);
  const dia = parseWhole(diastolic);
  const bpm = parseWhole(pulse);
  const mmol = parseDecimal(glucose);
  const pulseGiven = pulse.trim() !== '';
  const bad = (text: string, ok: boolean) => text.trim() !== '' && !ok;
  const sysBad = bad(systolic, within(sys, VITAL_LIMITS.systolic));
  const diaBad = bad(diastolic, within(dia, VITAL_LIMITS.diastolic));
  const pulseBad = bad(pulse, within(bpm, VITAL_LIMITS.pulse));
  const glucoseBad = bad(glucose, within(mmol, VITAL_LIMITS.glucose));
  const orderBad = !sysBad && !diaBad && !Number.isNaN(sys) && !Number.isNaN(dia) && dia >= sys;

  const ready =
    kind === 'BLOOD_PRESSURE'
      ? !Number.isNaN(sys) && !Number.isNaN(dia) && !sysBad && !diaBad && !orderBad && !pulseBad
      : kind === 'GLUCOSE'
        ? !Number.isNaN(mmol) && !glucoseBad
        : !Number.isNaN(bpm) && !pulseBad;

  const clear = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setGlucose('');
  };

  const save = () => {
    if (!ready) return;
    const input =
      kind === 'BLOOD_PRESSURE'
        ? { kind, systolic: sys, diastolic: dia, ...(pulseGiven ? { pulse: bpm } : {}) }
        : kind === 'GLUCOSE'
          ? { kind, glucoseMmol: mmol, glucoseContext: context }
          : { kind, pulse: bpm };
    const clientId = newClientId();
    const at = new Date().toISOString();
    // A reading that needs care now is said in a dialog, not a passing notice.
    const show = (reading: VitalReading, offline: boolean) => {
      setSaved(reading);
      clear();
      if (reading.advice === 'URGENT') Alert.alert(a.vitalUrgentTitle, adviceText(reading, a) ?? '');
      else if (offline) notice.success(a.savedOfflineTitle, a.savedOffline);
      else notice.success(a.vitalSaved, `${readingValue(reading)} · ${categoryText(reading.category, a)}`);
    };
    logVital({ variables: { input: { ...input, clientId } } })
      .then(({ data }) => {
        if (data?.logVital) show(data.logVital, false);
      })
      .catch((e: unknown) => {
        if (!isOfflineError(e)) {
          notice.failure(a.vitalsTitle, errorMessage(e, lang));
          return;
        }
        // Classed on the phone, so advice (urgent or not) is shown even without a connection.
        void enqueue({ kind: 'vital', input: { ...input, at, clientId } });
        show(
          {
            id: clientId,
            day: '',
            at,
            systolic: null,
            diastolic: null,
            pulse: null,
            glucoseMmol: null,
            glucoseContext: null,
            note: '',
            ...input,
            ...assessReading(input),
          },
          true
        );
      });
  };

  const remove = (reading: VitalReading) =>
    Alert.alert(a.vitalRemoveConfirm, `${readingValue(reading)} · ${dateText(reading.day, lang, true)}`, [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.remove,
        style: 'destructive',
        onPress: () => {
          if (saved?.id === reading.id) setSaved(null);
          deleteVital({ variables: { id: reading.id } }).catch((e: unknown) =>
            notice.failure(a.vitalsTitle, errorMessage(e, lang))
          );
        },
      },
    ]);

  const latestRow = (label: string, reading: VitalReading | null | undefined, pulseOnly = false) => {
    const category = pulseOnly ? (reading?.pulseCategory ?? null) : (reading?.category ?? null);
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[T.body, { color: c.text }]}>{label}</Text>
          {reading ? <Text style={[T.fine, { color: c.faint }]}>{dateText(reading.day, lang, true)}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[T.body, { color: c.text, fontFamily: font.bodySemi }]}>
            {reading ? (pulseOnly ? `${reading.pulse} bpm` : readingValue(reading)) : '–'}
          </Text>
          {category ? <Text style={[T.fine, { color: colorOf(category) }]}>{categoryText(category, a)}</Text> : null}
        </View>
      </View>
    );
  };

  const week = summary?.pressureWeek;

  return (
    <Screen
      onRefresh={() => Promise.all([summaryQuery.refetch(), historyQuery.refetch()])}
      header={<AppHeader title={a.vitalsTitle} subtitle={a.vitalsSub} backLabel={t.back} onBack={() => router.back()} />}
    >
      {summaryQuery.error && !summary ? (
        <>
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void summaryQuery.refetch()} />
          <Gap h={18} />
        </>
      ) : null}

      <FadeIn>
        <Section title={a.vitalsLatest}>
          {latestRow(a.vitalPressure, summary?.latestPressure)}
          <Divider />
          {latestRow(a.vitalGlucose, summary?.latestGlucose)}
          <Divider />
          {latestRow(a.vitalPulse, summary?.latestPulse, true)}
          {week && week.readings > 0 && week.category ? (
            <>
              <Divider />
              <View style={styles.row}>
                <Text style={[T.body, { color: c.text, flex: 1 }]}>
                  {a.vitalPressureWeek.replace('{n}', String(week.readings))}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[T.body, { color: c.text, fontFamily: font.bodySemi }]}>
                    {week.systolic}/{week.diastolic} mmHg
                  </Text>
                  <Text style={[T.fine, { color: colorOf(week.category) }]}>{categoryText(week.category, a)}</Text>
                </View>
              </View>
            </>
          ) : null}
        </Section>
      </FadeIn>

      <Gap h={18} />
      <FadeIn delay={40}>
        <Section title={a.vitalLogTitle}>
          <ChoiceRow
            label={a.vitalWhat}
            options={KINDS.map((value) => ({
              value,
              label: { BLOOD_PRESSURE: a.vitalPressure, GLUCOSE: a.vitalGlucose, PULSE: a.vitalPulse }[value],
            }))}
            value={kind}
            onChange={(next) => {
              setKind(next);
              setSaved(null);
            }}
          />

          {kind === 'BLOOD_PRESSURE' ? (
            <>
              <View style={styles.pair}>
                <View style={{ flex: 1 }}>
                  <Field
                    label={a.vitalSystolic}
                    value={systolic}
                    onChangeText={setSystolic}
                    keyboardType="number-pad"
                    placeholder="120"
                    maxLength={3}
                    errorText={sysBad ? a.outOfRange : undefined}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label={a.vitalDiastolic}
                    value={diastolic}
                    onChangeText={setDiastolic}
                    keyboardType="number-pad"
                    placeholder="80"
                    maxLength={3}
                    errorText={diaBad ? a.outOfRange : orderBad ? a.vitalOrderError : undefined}
                  />
                </View>
              </View>
              <Field
                label={a.vitalPulseOptional}
                value={pulse}
                onChangeText={setPulse}
                keyboardType="number-pad"
                placeholder="70"
                maxLength={3}
                errorText={pulseBad ? a.outOfRange : undefined}
              />
              <Text style={[T.fine, { color: c.faint }]}>{a.vitalPressureHow}</Text>
            </>
          ) : kind === 'GLUCOSE' ? (
            <>
              <Field
                label={a.vitalGlucoseLabel}
                value={glucose}
                onChangeText={setGlucose}
                keyboardType="decimal-pad"
                placeholder="5.5"
                maxLength={4}
                errorText={glucoseBad ? a.outOfRange : undefined}
              />
              <ChoiceRow
                label={a.vitalWhen}
                options={CONTEXTS.map((value) => ({
                  value,
                  label: { FASTING: a.vitalFasting, AFTER_MEAL: a.vitalAfterMeal, RANDOM: a.vitalRandom }[value],
                }))}
                value={context}
                onChange={setContext}
              />
              <Text style={[T.fine, { color: c.faint }]}>{a.vitalGlucoseHow}</Text>
            </>
          ) : (
            <>
              <Field
                label={a.vitalPulseLabel}
                value={pulse}
                onChangeText={setPulse}
                keyboardType="number-pad"
                placeholder="70"
                maxLength={3}
                errorText={pulseBad ? a.outOfRange : undefined}
              />
              <Text style={[T.fine, { color: c.faint }]}>{a.vitalPulseHow}</Text>
            </>
          )}

          <PrimaryButton label={a.save} onPress={save} busy={logging.loading} disabled={!ready} />
          {saved && saved.kind === kind ? <AdviceBox reading={saved} /> : null}
        </Section>
      </FadeIn>

      <Gap h={18} />
      <FadeIn delay={80}>
        <Section title={a.vitalHistoryTitle}>
          {history.length ? (
            history.map((reading, i) => (
              <React.Fragment key={reading.id}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[T.body, { color: c.text }]}>{readingValue(reading)}</Text>
                    <Text style={[T.fine, { color: c.faint }]}>
                      {dateText(reading.day, lang, true)} ·{' '}
                      <Text style={{ color: colorOf(reading.category) }}>{categoryText(reading.category, a)}</Text>
                      {reading.kind === 'GLUCOSE' && reading.glucoseContext
                        ? ` · ${{ FASTING: a.vitalFasting, AFTER_MEAL: a.vitalAfterMeal, RANDOM: a.vitalRandom }[reading.glucoseContext]}`
                        : ''}
                    </Text>
                  </View>
                  <Pressable
                    ripple="borderless"
                    onPress={() => remove(reading)}
                    accessibilityRole="button"
                    accessibilityLabel={a.remove}
                    hitSlop={10}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.faint} />
                  </Pressable>
                </View>
              </React.Fragment>
            ))
          ) : (
            <Text style={[T.fine, { color: c.faint }]}>{a.vitalHistoryEmpty}</Text>
          )}
        </Section>
        <Text style={[T.fine, { color: c.faint, marginTop: 10, marginHorizontal: 2 }]}>{a.vitalsDisclaimer}</Text>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pair: { flexDirection: 'row', gap: 12 },
});
