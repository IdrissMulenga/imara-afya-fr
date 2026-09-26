// Cycle tab (women only): cycle day and phase, period logging, today's log, insights,
// the next three periods, a month calendar, averages, reminders, report and history.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Gap } from '@/components/screen';
import { ErrorNote, LinkText, PrimaryButton, QuietButton } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section, Divider, NavRow, SwitchRow } from '@/components/panel';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MiniStat, ProgressRing } from '@/components/steps-ring';
import { useNotice } from '@/components/notice';
import {
  CYCLE_COLOR,
  CYCLE_COLOR_TO,
  CYCLE_REFETCH,
  CalendarLegend,
  CycleMonth,
  FERTILE_COLOR,
  addDays,
  dateText,
  daysBetween,
  flowLabel,
  noteText,
  phaseLabel,
  phaseTip,
  phaseWhen,
  rangeText,
  symptomLabel,
  useCycleDays,
  useCycleSummary,
} from '@/components/cycle';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { localDay } from '@/lib/steps';
import { useCycleReminders } from '@/lib/cycle-reminders';
import { CYCLE_LIMITS, DELETE_PERIOD, END_PERIOD, START_PERIOD, type CyclePhase, type CycleSummary } from '@/graphql/cycle';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const PHASE_ICON: Record<CyclePhase, IconName> = {
  MENSTRUAL: 'water',
  FOLLICULAR: 'sprout',
  FERTILE: 'flower',
  LUTEAL: 'moon-waning-crescent',
  UNKNOWN: 'flower-outline',
};

// The line under the ring: period day, days until the next period, or how late it is.
function predictionLine(s: CycleSummary, today: string, a: AppCopy): string {
  if (s.current && !s.autoEnded) {
    return a.periodDayN.replace('{n}', String(daysBetween(s.current.start, today) + 1));
  }
  const n = s.nextPeriodInDays;
  if (n == null) return a.cycleEmpty;
  if (n > 1) return a.nextPeriodIn.replace('{n}', String(n));
  if (n === 1) return a.nextPeriodTomorrow;
  if (n === 0) return a.periodToday;
  return a.periodLate.replace('{n}', String(-n));
}

export default function CycleScreen() {
  const router = useRouter();
  const { lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const notice = useNotice();
  const a = APP_COPY[lang];
  const today = localDay();
  const female = user?.gender === 'female';

  const query = useCycleSummary(!female);
  const days = useCycleDays(addDays(today, -120), today, !female);
  const reminders = useCycleReminders();
  const options = { refetchQueries: CYCLE_REFETCH, awaitRefetchQueries: true };
  const [startPeriod, starting] = useMutation(START_PERIOD, options);
  const [endPeriod, ending] = useMutation(END_PERIOD, options);
  const [deletePeriod] = useMutation(DELETE_PERIOD, options);

  // "Pick another day": which action, and how many days back from today.
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const [back, setBack] = useState(1);
  const [monthOffset, setMonthOffset] = useState(0);

  if (!user) return <Screen />;
  if (!female) return <Redirect href="/dashboard" />;

  const s = query.data?.cycleSummary;
  const open = s?.current && !s.autoEnded ? s.current : null;
  const busy = starting.loading || ending.loading;

  const log = (action: 'start' | 'end', day?: string) => {
    const mutate = action === 'end' ? endPeriod : startPeriod;
    mutate({ variables: { day: day ?? null } })
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        notice.success(a.periodSaved);
        setPicking(null);
        setBack(1);
      })
      .catch((e: unknown) => notice.failure(a.cycleTitle, errorMessage(e, lang)));
  };

  const remove = (id: string) =>
    Alert.alert(a.removePeriodConfirm, undefined, [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.remove,
        style: 'destructive',
        onPress: () => {
          deletePeriod({ variables: { id } })
            .then(() => notice.success(a.periodRemoved))
            .catch((e: unknown) => notice.failure(a.cycleTitle, errorMessage(e, lang)));
        },
      },
    ]);

  const openDay = (day: string) => router.push({ pathname: '/cycle-day', params: { day } });

  // The earliest day that can be picked: 90 days back, and for an end not before the start.
  const maxBack =
    picking === 'end' && s?.current
      ? Math.min(CYCLE_LIMITS.backdateDays, daysBetween(s.current.start, today))
      : CYCLE_LIMITS.backdateDays;
  const pickedDay = addDays(today, -back);
  const [y, m] = today.split('-').map(Number);
  const shown = new Date(Date.UTC(y, m - 1 + monthOffset, 1));
  const todayLog = s?.today ?? null;

  return (
    <Screen
      onRefresh={() => Promise.all([query.refetch(), days.refetch()])}
      header={<AppHeader title={a.cycleTitle} subtitle={a.cycleSub} />}
      tabbed
    >
      <FadeIn>
        <Glass style={{ padding: 20 }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <ProgressRing
              progress={s?.cycleDay ? Math.min(1, s.cycleDay / s.averageCycleLength) : 0}
              size={210}
              stroke={16}
              from={CYCLE_COLOR}
              to={CYCLE_COLOR_TO}
              label={s?.cycleDay ? a.cycleDayN.replace('{n}', String(s.cycleDay)) : a.phaseUnknown}
            >
              <MaterialCommunityIcons name={PHASE_ICON[s?.phase ?? 'UNKNOWN']} size={28} color={CYCLE_COLOR} />
              <Text style={[styles.day, { color: c.text }]}>
                {s?.cycleDay ? a.cycleDayN.replace('{n}', String(s.cycleDay)) : '–'}
              </Text>
              <Text style={[T.fine, { color: c.muted }]}>{phaseLabel(s?.phase ?? 'UNKNOWN', a)}</Text>
            </ProgressRing>

            {s ? (
              <Text style={[T.body, { color: c.text, textAlign: 'center', fontFamily: font.bodySemi }]}>
                {predictionLine(s, today, a)}
              </Text>
            ) : null}
            {s?.phase === 'FERTILE' ? (
              <Text style={[T.fine, { color: FERTILE_COLOR, textAlign: 'center' }]}>{a.fertileNow}</Text>
            ) : s?.fertileStart && s.fertileStart > today ? (
              <Text style={[T.fine, { color: c.muted, textAlign: 'center' }]}>
                {a.fertileFrom.replace('{date}', dateText(s.fertileStart, lang))}
              </Text>
            ) : null}
            {s?.autoEnded && s.current ? (
              <Text style={[T.fine, { color: c.muted, textAlign: 'center' }]}>
                {a.autoEndedNote.replace('{n}', String(s.averagePeriodLength))}
              </Text>
            ) : null}
          </View>

          <Gap h={18} />
          {picking ? (
            <View style={{ gap: 12 }}>
              <View style={styles.picker}>
                <RoundStep icon="chevron-left" disabled={back >= maxBack} onPress={() => setBack(back + 1)} />
                <Text style={[T.body, styles.pickedDay, { color: c.text }]}>{dateText(pickedDay, lang, true)}</Text>
                <RoundStep icon="chevron-right" disabled={back <= 1} onPress={() => setBack(back - 1)} />
              </View>
              <PrimaryButton
                label={picking === 'end' ? a.periodEndedOn : a.periodStartedOn}
                busy={busy}
                onPress={() => log(picking, pickedDay)}
              />
              <View style={{ alignItems: 'center' }}>
                <LinkText label={a.cancel} onPress={() => setPicking(null)} />
              </View>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <PrimaryButton
                label={open ? a.periodEndedToday : a.periodStartedToday}
                busy={busy}
                onPress={() => log(open ? 'end' : 'start')}
              />
              <View style={styles.links}>
                <LinkText label={a.anotherDay} onPress={() => setPicking(open ? 'end' : 'start')} />
                {s?.autoEnded && s.current ? <LinkText label={a.setEndDay} onPress={() => setPicking('end')} /> : null}
              </View>
            </View>
          )}
        </Glass>
      </FadeIn>

      {query.error && !s ? (
        <>
          <Gap h={18} />
          <ErrorNote message={a.couldNotLoad} />
          <Gap h={12} />
          <QuietButton label={a.retry} onPress={() => void query.refetch()} />
        </>
      ) : null}

      {s ? (
        <>
          <Gap h={18} />
          <FadeIn delay={40}>
            <Glass style={{ padding: 16 }}>
              <View style={styles.cardHead}>
                <MaterialCommunityIcons name="calendar-today" size={18} color={CYCLE_COLOR} />
                <Text style={[T.label, { color: c.faint, flex: 1 }]}>{a.todayLogTitle}</Text>
              </View>
              {todayLog ? (
                <View style={styles.chips}>
                  {todayLog.flow !== 'NONE' ? <Chip icon="water" text={flowLabel(todayLog.flow, a)} tint={CYCLE_COLOR} /> : null}
                  {todayLog.symptoms.map((sym) => (
                    <Chip key={sym} text={symptomLabel(sym, a)} tint={c.primary} />
                  ))}
                </View>
              ) : (
                <Text style={[T.fine, { color: c.muted, marginTop: 8 }]}>{a.nothingLogged}</Text>
              )}
              <Gap h={12} />
              <QuietButton label={todayLog ? a.editToday : a.logToday} onPress={() => openDay(today)} />
            </Glass>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={70}>
            <Section title={a.insightsTitle}>
              <Insight icon={PHASE_ICON[s.phase]} tint={CYCLE_COLOR} text={phaseTip(s.phase, a)} />
              {s.notes.map((note) => (
                <React.Fragment key={note}>
                  <Divider />
                  <Insight icon="stethoscope" tint={c.danger} text={noteText(note, a)} />
                </React.Fragment>
              ))}
              {s.patterns.map((p) => (
                <React.Fragment key={p.symptom}>
                  <Divider />
                  <Insight
                    icon="chart-timeline-variant"
                    tint={c.primary}
                    text={a.patternText.replace('{symptom}', symptomLabel(p.symptom, a)).replace('{phase}', phaseWhen(p.phase, a))}
                    hint={a.patternCount.replace('{n}', String(p.count))}
                  />
                </React.Fragment>
              ))}
            </Section>
          </FadeIn>

          {s.predictions.length ? (
            <>
              <Gap h={18} />
              <FadeIn delay={100}>
                <Section title={a.upcomingTitle}>
                  {s.predictions.map((p, i) => (
                    <React.Fragment key={p.start}>
                      {i > 0 ? <Divider /> : null}
                      <View style={styles.row}>
                        <View style={[styles.dotBig, { borderColor: CYCLE_COLOR }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[T.body, { color: c.text }]}>{rangeText(p.earliest, p.latest, lang)}</Text>
                          <Text style={[T.fine, { color: c.faint }]}>
                            {a.upcomingFertile.replace('{range}', rangeText(p.fertileStart, p.fertileEnd, lang))}
                          </Text>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
                </Section>
              </FadeIn>
            </>
          ) : null}

          <Gap h={18} />
          <FadeIn delay={130}>
            <Glass style={{ padding: 16 }}>
              <View style={styles.calHead}>
                <Pressable onPress={() => setMonthOffset(monthOffset - 1)} hitSlop={10} accessibilityRole="button">
                  <MaterialCommunityIcons name="chevron-left" size={24} color={c.text} />
                </Pressable>
                <Text style={[T.body, styles.monthName, { color: c.text }]}>
                  {shown.toLocaleDateString(lang === 'rn' ? 'fr' : lang, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </Text>
                <Pressable onPress={() => setMonthOffset(monthOffset + 1)} hitSlop={10} accessibilityRole="button">
                  <MaterialCommunityIcons name="chevron-right" size={24} color={c.text} />
                </Pressable>
              </View>
              <CycleMonth
                year={shown.getUTCFullYear()}
                month={shown.getUTCMonth()}
                summary={s}
                logs={days.byDay}
                today={today}
                lang={lang}
                onPressDay={openDay}
              />
              <CalendarLegend a={a} />
              <Gap h={12} />
              <QuietButton label={a.openCalendar} onPress={() => router.push('/cycle-calendar')} />
            </Glass>
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={160}>
            <View style={styles.stats}>
              <Glass style={styles.stat}>
                <MiniStat icon="sync" value={a.daysN.replace('{n}', String(s.averageCycleLength))} caption={a.avgCycle} tint={CYCLE_COLOR} />
              </Glass>
              <Glass style={styles.stat}>
                <MiniStat icon="water" value={a.daysN.replace('{n}', String(s.averagePeriodLength))} caption={a.avgPeriod} tint={CYCLE_COLOR} />
              </Glass>
              <Glass style={styles.stat}>
                <MiniStat
                  icon="swap-vertical"
                  value={s.cycleVariation == null ? '–' : a.daysN.replace('{n}', String(s.cycleVariation))}
                  caption={a.variationLabel}
                  tint={CYCLE_COLOR}
                />
              </Glass>
            </View>
            {s.cyclesUsed === 0 ? (
              <Text style={[T.fine, { color: c.faint, marginTop: 8, textAlign: 'center' }]}>{a.usingTypical}</Text>
            ) : null}
          </FadeIn>

          <Gap h={18} />
          <FadeIn delay={190}>
            <Glass style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
              {reminders.supported ? (
                <>
                  <View style={{ paddingVertical: 6 }}>
                    <SwitchRow
                      label={a.cycleReminders}
                      hint={a.cycleRemindersNote}
                      value={reminders.enabled}
                      onChange={(on) => {
                        void reminders.set(on).then((result) => {
                          if (result === 'denied') notice.failure(a.cycleReminders, a.notificationsDenied);
                        });
                      }}
                    />
                  </View>
                  <Divider />
                </>
              ) : null}
              <View style={{ paddingVertical: 6 }}>
                <NavRow label={a.reportTitle} hint={a.reportSub} onPress={() => router.push('/cycle-report')} />
              </View>
            </Glass>
          </FadeIn>

          {s.periods.length ? (
            <>
              <Gap h={18} />
              <FadeIn delay={220}>
                <Section title={a.periodsHistory}>
                  {s.periods.map((p, i) => (
                    <React.Fragment key={p.id}>
                      {i > 0 ? <Divider /> : null}
                      <View style={styles.row}>
                        <View style={[styles.dotSolid, { backgroundColor: CYCLE_COLOR }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[T.body, { color: c.text }]}>
                            {dateText(p.start, lang)}
                            {p.end ? ` – ${dateText(p.end, lang)}` : ''}
                          </Text>
                          <Text style={[T.fine, { color: c.faint }]}>
                            {p.lengthDays ? a.daysN.replace('{n}', String(p.lengthDays)) : a.ongoing}
                            {p.cycleLength ? ` · ${a.cycleOfN.replace('{n}', String(p.cycleLength))}` : ''}
                          </Text>
                        </View>
                        <Pressable onPress={() => remove(p.id)} accessibilityRole="button" accessibilityLabel={a.remove} hitSlop={10}>
                          <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.faint} />
                        </Pressable>
                      </View>
                    </React.Fragment>
                  ))}
                </Section>
              </FadeIn>
            </>
          ) : null}
        </>
      ) : null}

      <Gap h={18} />
      <View style={styles.note}>
        <MaterialCommunityIcons name="information-outline" size={16} color={c.faint} style={{ marginTop: 1 }} />
        <Text style={[T.fine, { color: c.faint, flex: 1 }]}>{a.cycleDisclaimer}</Text>
      </View>
    </Screen>
  );
}

function RoundStep({ icon, disabled, onPress }: { icon: IconName; disabled?: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.step, { backgroundColor: c.track, opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={c.text} />
    </Pressable>
  );
}

function Chip({ icon, text, tint }: { icon?: IconName; text: string; tint: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: `${tint}1F` }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={14} color={tint} /> : null}
      <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: tint }}>{text}</Text>
    </View>
  );
}

function Insight({ icon, tint, text, hint }: { icon: IconName; tint: string; text: string; hint?: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.insight}>
      <View style={[styles.insightIcon, { backgroundColor: `${tint}1F` }]}>
        <MaterialCommunityIcons name={icon} size={17} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[T.fine, { color: c.text }]}>{text}</Text>
        {hint ? <Text style={[T.fine, { color: c.faint, fontSize: 11 }]}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  day: { fontFamily: font.displayBold, fontSize: 30 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  pickedDay: { fontFamily: font.bodySemi, minWidth: 130, textAlign: 'center' },
  step: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  insight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  monthName: { fontFamily: font.bodySemi, flex: 1, textAlign: 'center', textTransform: 'capitalize' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dotSolid: { width: 10, height: 10, borderRadius: 5 },
  dotBig: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderStyle: 'dashed' },
  note: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
});
