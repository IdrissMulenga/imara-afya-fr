// Shared cycle UI: colours, date helpers, labels, how calendar days are marked, and the
// month grid.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@apollo/client/react';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import type { Lang } from '@/theme/i18n';
import type { AppCopy } from '@/theme/copy-app';
import {
  CYCLE_DAYS,
  CYCLE_SUMMARY,
  type CycleDay,
  type CycleDischarge,
  type CycleFlow,
  type CycleNote,
  type CyclePhase,
  type CycleSummary,
  type CycleSymptom,
} from '@/graphql/cycle';

export const CYCLE_COLOR = '#E0527E';
export const CYCLE_COLOR_TO = '#F59AB8';
export const FERTILE_COLOR = '#2BA89A';
/** Queries refreshed after any cycle change. */
export const CYCLE_REFETCH = ['CycleSummary', 'CycleDays'];

/** Date maths on YYYY-MM-DD strings. */
export const addDays = (day: string, n: number): string => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

/** Date locale for a language; Kirundi uses French formats. */
export const locale = (lang: Lang) => (lang === 'rn' ? 'fr' : lang);

/** "25 Sep", or "Fri 25 Sep" with the weekday. */
export const dateText = (day: string, lang: Lang, withWeekday = false): string => {
  try {
    return new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(lang), {
      ...(withWeekday ? { weekday: 'short' } : {}),
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  } catch {
    return day;
  }
};

/** "12–15 Oct" (or "30 Sep – 2 Oct"). */
export const rangeText = (from: string, to: string, lang: Lang): string =>
  from === to ? dateText(from, lang) : `${dateText(from, lang)} – ${dateText(to, lang)}`;

/** Labels in the app's language. */
export const flowLabel = (flow: CycleFlow, a: AppCopy): string =>
  ({ NONE: a.flowNone, SPOTTING: a.flowSpotting, LIGHT: a.flowLight, MEDIUM: a.flowMedium, HEAVY: a.flowHeavy })[flow];

export const symptomLabel = (symptom: CycleSymptom, a: AppCopy): string =>
  ({
    CRAMPS: a.symCramps,
    HEADACHE: a.symHeadache,
    BACK_PAIN: a.symBackPain,
    BLOATING: a.symBloating,
    TENDER_BREASTS: a.symTenderBreasts,
    ACNE: a.symAcne,
    FATIGUE: a.symFatigue,
    NAUSEA: a.symNausea,
    CRAVINGS: a.symCravings,
    INSOMNIA: a.symInsomnia,
    MOOD_SWINGS: a.symMoodSwings,
    ANXIETY: a.symAnxiety,
  })[symptom];

export const dischargeLabel = (discharge: CycleDischarge, a: AppCopy): string =>
  ({
    DRY: a.disDry,
    STICKY: a.disSticky,
    CREAMY: a.disCreamy,
    WATERY: a.disWatery,
    EGG_WHITE: a.disEggWhite,
    UNUSUAL: a.disUnusual,
  })[discharge];

export const phaseLabel = (phase: CyclePhase, a: AppCopy): string =>
  ({
    MENSTRUAL: a.phaseMenstrual,
    FOLLICULAR: a.phaseFollicular,
    FERTILE: a.phaseFertile,
    LUTEAL: a.phaseLuteal,
    UNKNOWN: a.phaseUnknown,
  })[phase];

export const phaseTip = (phase: CyclePhase, a: AppCopy): string =>
  ({
    MENSTRUAL: a.tipMenstrual,
    FOLLICULAR: a.tipFollicular,
    FERTILE: a.tipFertile,
    LUTEAL: a.tipLuteal,
    UNKNOWN: a.tipUnknown,
  })[phase];

/** Where in the cycle a symptom usually comes, e.g. "during your period". */
export const phaseWhen = (phase: CyclePhase, a: AppCopy): string =>
  ({
    MENSTRUAL: a.inMenstrual,
    FOLLICULAR: a.inFollicular,
    FERTILE: a.inFertile,
    LUTEAL: a.inLuteal,
    UNKNOWN: '',
  })[phase];

export const noteText = (note: CycleNote, a: AppCopy): string =>
  ({
    IRREGULAR: a.noteIrregular,
    SHORT_CYCLES: a.noteShort,
    LONG_CYCLES: a.noteLong,
    LONG_PERIODS: a.noteLongPeriods,
    VERY_LATE: a.noteVeryLate,
  })[note];

/** True for light, medium or heavy flow (not spotting). */
export const bleedingFlow = (flow: CycleFlow | undefined) => flow === 'LIGHT' || flow === 'MEDIUM' || flow === 'HEAVY';

/** The cycle summary query; skip it when not needed. */
export function useCycleSummary(skip = false) {
  return useQuery<{ cycleSummary: CycleSummary }>(CYCLE_SUMMARY, { skip });
}

/** Day logs between two days, keyed by day. */
export function useCycleDays(from: string, to: string, skip = false) {
  const query = useQuery<{ cycleDays: CycleDay[] }>(CYCLE_DAYS, { variables: { from, to }, skip });
  const byDay = useMemo(() => new Map((query.data?.cycleDays ?? []).map((d) => [d.day, d])), [query.data]);
  return { ...query, byDay };
}

export type DayMark = {
  /** Logged period (solid), expected period (dashed), fertile, ovulation, or nothing. */
  kind: 'period' | 'predicted' | 'fertile' | 'ovulation' | null;
  spotting: boolean;
  symptoms: boolean;
};

/** How one calendar day is marked, from the periods, their estimates and the day logs. */
export function markDay(day: string, s: CycleSummary, logs: Map<string, CycleDay>, today: string): DayMark {
  const log = logs.get(day);
  const extra = { spotting: log?.flow === 'SPOTTING', symptoms: !!log?.symptoms.length };

  for (const p of s.periods) {
    const open = p.end == null;
    const end = p.end ?? (s.current?.id === p.id && s.currentEnd ? s.currentEnd : addDays(p.start, s.averagePeriodLength - 1));
    if (day >= p.start && day <= end) {
      return { kind: open && day > today ? 'predicted' : 'period', ...extra };
    }
  }
  if (bleedingFlow(log?.flow)) return { kind: 'period', ...extra };

  for (const pr of s.predictions) {
    if (day >= pr.start && day <= pr.end) return { kind: 'predicted', ...extra };
    if (day === pr.ovulationDay) return { kind: 'ovulation', ...extra };
    if (day >= pr.fertileStart && day <= pr.fertileEnd) return { kind: 'fertile', ...extra };
  }
  // Past cycles: ovulation about 14 days before the next logged start.
  const oldestFirst = [...s.periods].reverse();
  for (let i = 1; i < oldestFirst.length; i++) {
    const ovulation = addDays(oldestFirst[i].start, -14);
    if (day === ovulation) return { kind: 'ovulation', ...extra };
    if (day >= addDays(ovulation, -5) && day <= addDays(ovulation, 1)) return { kind: 'fertile', ...extra };
  }
  return { kind: null, ...extra };
}

/** One month of days with period, expected period, fertile window and log marks. */
export function CycleMonth({
  year,
  month,
  summary,
  logs,
  today,
  lang,
  onPressDay,
  showTitle = false,
}: {
  year: number;
  /** 0 to 11. */
  month: number;
  summary: CycleSummary;
  logs: Map<string, CycleDay>;
  today: string;
  lang: Lang;
  onPressDay?: (day: string) => void;
  showTitle?: boolean;
}) {
  const { c } = useTheme();

  const { cells, weekdays, title } = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1));
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    // Monday first.
    const lead = (first.getUTCDay() + 6) % 7;
    const list: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++) list.push(new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10));
    while (list.length % 7) list.push(null);
    const names = Array.from({ length: 7 }, (_, i) =>
      new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(locale(lang), { weekday: 'narrow', timeZone: 'UTC' }),
    );
    const heading = first.toLocaleDateString(locale(lang), { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return { cells: list, weekdays: names, title: heading };
  }, [year, month, lang]);

  return (
    <View>
      {showTitle ? <Text style={[styles.monthTitle, { color: c.text }]}>{title}</Text> : null}
      <View style={styles.week}>
        {weekdays.map((w, i) => (
          <Text key={i} style={[styles.weekday, { color: c.faint }]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={styles.cell} />;
          const mark = markDay(day, summary, logs, today);
          const isToday = day === today;
          const filled = mark.kind === 'period';
          const content = (
            <View
              style={[
                styles.circle,
                filled ? { backgroundColor: CYCLE_COLOR } : null,
                mark.kind === 'predicted' ? { borderWidth: 1.5, borderColor: CYCLE_COLOR, borderStyle: 'dashed' } : null,
                mark.kind === 'fertile' ? { backgroundColor: `${FERTILE_COLOR}26` } : null,
                mark.kind === 'ovulation' ? { borderWidth: 2, borderColor: FERTILE_COLOR, backgroundColor: `${FERTILE_COLOR}26` } : null,
                isToday && !filled ? { borderWidth: 2, borderColor: c.text } : null,
              ]}
            >
              <Text style={{ fontFamily: isToday ? font.bodySemi : font.body, fontSize: 13, color: filled ? '#FFFFFF' : c.text }}>
                {Number(day.slice(8))}
              </Text>
              {mark.symptoms || mark.spotting ? (
                <View style={styles.dots}>
                  {mark.spotting ? <View style={[styles.dot, { backgroundColor: filled ? '#FFFFFF' : CYCLE_COLOR }]} /> : null}
                  {mark.symptoms ? <View style={[styles.dot, { backgroundColor: filled ? '#FFFFFF' : c.primary }]} /> : null}
                </View>
              ) : null}
            </View>
          );
          return (
            <View key={day} style={styles.cell}>
              {onPressDay ? (
                <Pressable
                  onPress={() => onPressDay(day)}
                  accessibilityRole="button"
                  accessibilityLabel={dateText(day, lang, true)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  {content}
                </Pressable>
              ) : (
                content
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** What each calendar mark means. */
export function CalendarLegend({ a }: { a: AppCopy }) {
  const { c } = useTheme();
  const item = (swatch: object, label: string) => (
    <View style={styles.legendItem} key={label}>
      <View style={[styles.swatch, swatch]} />
      <Text style={[T.fine, { color: c.muted, fontSize: 11 }]}>{label}</Text>
    </View>
  );
  return (
    <View style={styles.legend}>
      {item({ backgroundColor: CYCLE_COLOR }, a.legendPeriod)}
      {item({ borderWidth: 1.5, borderColor: CYCLE_COLOR, borderStyle: 'dashed' }, a.legendPredicted)}
      {item({ backgroundColor: `${FERTILE_COLOR}40` }, a.legendFertile)}
      {item({ borderWidth: 2, borderColor: FERTILE_COLOR }, a.legendOvulation)}
      {item({ backgroundColor: c.primary, width: 6, height: 6, borderRadius: 3 }, a.legendLogged)}
    </View>
  );
}

const styles = StyleSheet.create({
  monthTitle: { fontFamily: font.displayBold, fontSize: 18, marginBottom: 10, textTransform: 'capitalize' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: font.bodySemi, fontSize: 11, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 4, flexDirection: 'row', gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
});
