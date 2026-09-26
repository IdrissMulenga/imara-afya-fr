// One cycle day (?day=YYYY-MM-DD): flow, symptoms, discharge, note, period start/end.
// A future day shows what is expected instead.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { Field, PrimaryButton, QuietButton } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import {
  CYCLE_COLOR,
  CYCLE_REFETCH,
  FERTILE_COLOR,
  dateText,
  daysBetween,
  dischargeLabel,
  flowLabel,
  markDay,
  symptomLabel,
  useCycleDays,
  useCycleSummary,
} from '@/components/cycle';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { localDay } from '@/lib/steps';
import {
  CYCLE_LIMITS,
  DISCHARGES,
  END_PERIOD,
  FLOWS,
  LOG_CYCLE_DAY,
  START_PERIOD,
  SYMPTOMS,
  type CycleDischarge,
  type CycleFlow,
  type CycleSymptom,
} from '@/graphql/cycle';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Drops per flow: none shows a crossed drop.
const FLOW_ICON: Record<CycleFlow, IconName> = {
  NONE: 'water-off-outline',
  SPOTTING: 'water-outline',
  LIGHT: 'water',
  MEDIUM: 'water',
  HEAVY: 'water',
};
const FLOW_DROPS: Record<CycleFlow, number> = { NONE: 1, SPOTTING: 1, LIGHT: 1, MEDIUM: 2, HEAVY: 3 };

export default function CycleDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ day?: string }>();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const notice = useNotice();
  const a = APP_COPY[lang];
  const today = localDay();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? '') ? (params.day as string) : today;
  const future = day > today;
  const tooOld = daysBetween(day, today) > CYCLE_LIMITS.backdateDays;

  const summaryQuery = useCycleSummary();
  const dayQuery = useCycleDays(day, day, future);
  const saved = dayQuery.byDay.get(day) ?? null;
  const options = { refetchQueries: CYCLE_REFETCH, awaitRefetchQueries: true };
  const [logDay, logging] = useMutation(LOG_CYCLE_DAY, options);
  const [startPeriod, starting] = useMutation(START_PERIOD, options);
  const [endPeriod, ending] = useMutation(END_PERIOD, options);

  const [flow, setFlow] = useState<CycleFlow>('NONE');
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>([]);
  const [discharge, setDischarge] = useState<CycleDischarge | null>(null);
  const [note, setNote] = useState('');

  // Fills the form once the saved log arrives.
  useEffect(() => {
    if (!saved) return;
    setFlow(saved.flow);
    setSymptoms(saved.symptoms);
    setDischarge(saved.discharge);
    setNote(saved.note);
  }, [saved]);

  const s = summaryQuery.data?.cycleSummary;
  const mark = s ? markDay(day, s, dayQuery.byDay, today) : null;
  const latestStart = s?.periods[0]?.start ?? null;
  const open = s?.current && !s.autoEnded ? s.current : null;
  const canStart = !future && !tooOld && !open && (!latestStart || day > latestStart) && mark?.kind !== 'period';
  const canEnd = !future && !!s?.current && day >= s.current.start;

  const toggle = (symptom: CycleSymptom) => {
    Haptics.selectionAsync().catch(() => {});
    setSymptoms(symptoms.includes(symptom) ? symptoms.filter((x) => x !== symptom) : [...symptoms, symptom]);
  };

  const save = () => {
    logDay({ variables: { input: { day, flow, symptoms, discharge, note: note.trim() } } })
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        notice.success(a.periodSaved);
        router.back();
      })
      .catch((e: unknown) => notice.failure(a.dayLogTitle, errorMessage(e, lang)));
  };

  const period = (action: 'start' | 'end') => {
    (action === 'start' ? startPeriod : endPeriod)({ variables: { day } })
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        notice.success(a.periodSaved);
      })
      .catch((e: unknown) => notice.failure(a.cycleTitle, errorMessage(e, lang)));
  };

  const title = day === today ? a.dayToday : dateText(day, lang, true);

  return (
    <Screen
      header={<AppHeader title={title} subtitle={a.dayLogTitle} backLabel={t.back} onBack={() => router.back()} />}
      footer={
        future || tooOld ? undefined : (
          <PrimaryButton label={a.save} onPress={save} busy={logging.loading} />
        )
      }
    >
      {mark?.kind ? (
        <FadeIn>
          <View style={[styles.banner, { backgroundColor: `${mark.kind === 'fertile' || mark.kind === 'ovulation' ? FERTILE_COLOR : CYCLE_COLOR}1A` }]}>
            <MaterialCommunityIcons
              name={mark.kind === 'period' ? 'water' : mark.kind === 'predicted' ? 'calendar-clock' : 'flower'}
              size={18}
              color={mark.kind === 'fertile' || mark.kind === 'ovulation' ? FERTILE_COLOR : CYCLE_COLOR}
            />
            <Text style={[T.fine, { color: c.text, flex: 1, fontFamily: font.bodySemi }]}>
              {mark.kind === 'period'
                ? a.dayInPeriod
                : mark.kind === 'predicted'
                  ? a.dayExpectedPeriod
                  : mark.kind === 'ovulation'
                    ? a.dayOvulation
                    : a.dayFertile}
            </Text>
          </View>
          <Gap h={14} />
        </FadeIn>
      ) : null}

      {future ? (
        <Text style={[T.body, { color: c.muted }]}>{a.futureDay}</Text>
      ) : tooOld ? (
        <Text style={[T.body, { color: c.muted }]}>{a.dayTooOld}</Text>
      ) : (
        <>
          <FadeIn>
            <Glass style={{ padding: 16 }}>
              <Text style={[T.label, { color: c.faint }]}>{a.flowLabel}</Text>
              <View style={styles.flows}>
                {FLOWS.map((f) => {
                  const on = flow === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setFlow(f);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={flowLabel(f, a)}
                      style={[styles.flow, { borderColor: on ? CYCLE_COLOR : c.border, backgroundColor: on ? `${CYCLE_COLOR}1F` : c.field }]}
                    >
                      <View style={styles.drops}>
                        {Array.from({ length: FLOW_DROPS[f] }, (_, i) => (
                          <MaterialCommunityIcons key={i} name={FLOW_ICON[f]} size={f === 'SPOTTING' ? 14 : 16} color={on ? CYCLE_COLOR : c.faint} />
                        ))}
                      </View>
                      <Text style={[styles.flowText, { color: on ? CYCLE_COLOR : c.muted }]} numberOfLines={1}>
                        {flowLabel(f, a)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Glass>
          </FadeIn>

          <Gap h={14} />
          <FadeIn delay={40}>
            <Glass style={{ padding: 16 }}>
              <Text style={[T.label, { color: c.faint }]}>{a.symptomsLabel}</Text>
              <View style={styles.chips}>
                {SYMPTOMS.map((sym) => (
                  <ChoiceChip key={sym} label={symptomLabel(sym, a)} on={symptoms.includes(sym)} tint={c.primary} onPress={() => toggle(sym)} />
                ))}
              </View>
            </Glass>
          </FadeIn>

          <Gap h={14} />
          <FadeIn delay={80}>
            <Glass style={{ padding: 16 }}>
              <Text style={[T.label, { color: c.faint }]}>{a.dischargeLabel}</Text>
              <View style={styles.chips}>
                {DISCHARGES.map((d) => (
                  <ChoiceChip
                    key={d}
                    label={dischargeLabel(d, a)}
                    on={discharge === d}
                    tint={FERTILE_COLOR}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setDischarge(discharge === d ? null : d);
                    }}
                  />
                ))}
              </View>
            </Glass>
          </FadeIn>

          <Gap h={14} />
          <FadeIn delay={120}>
            <Field
              label={a.dayNoteLabel}
              value={note}
              onChangeText={setNote}
              placeholder={a.checkInNotePlaceholder}
              maxLength={CYCLE_LIMITS.note}
              multiline
              textAlignVertical="top"
              style={styles.note}
            />
          </FadeIn>

          {canStart || canEnd ? (
            <>
              <Gap h={14} />
              <FadeIn delay={160}>
                <View style={{ gap: 10 }}>
                  {canStart ? (
                    <QuietButton label={starting.loading ? a.saving : a.periodStartedHere} onPress={() => period('start')} />
                  ) : null}
                  {canEnd ? (
                    <QuietButton label={ending.loading ? a.saving : a.periodEndedHere} onPress={() => period('end')} />
                  ) : null}
                </View>
              </FadeIn>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function ChoiceChip({ label, on, tint, onPress }: { label: string; on: boolean; tint: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={[styles.chip, { borderColor: on ? tint : c.border, backgroundColor: on ? `${tint}1F` : c.field }]}
    >
      {on ? <MaterialCommunityIcons name="check" size={14} color={tint} /> : null}
      <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: on ? tint : c.text }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  flows: { flexDirection: 'row', gap: 6, marginTop: 12 },
  flow: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  drops: { flexDirection: 'row', height: 18, alignItems: 'center' },
  flowText: { fontFamily: font.bodySemi, fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  note: { height: undefined, minHeight: 90, paddingTop: 14, paddingBottom: 14 },
});
