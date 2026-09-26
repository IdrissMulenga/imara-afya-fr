// Health report: a cycle summary for a health worker, shown and shared as text.
import React from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { PrimaryButton } from '@/components/ui';
import { Section, Divider, FactRow } from '@/components/panel';
import { FadeIn } from '@/components/motion';
import { dateText, noteText, phaseWhen, rangeText, symptomLabel, useCycleSummary } from '@/components/cycle';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { localDay } from '@/lib/steps';
import type { CycleSummary } from '@/graphql/cycle';

// The report as plain text for sharing.
function reportText(s: CycleSummary, name: string, today: string, lang: Lang, a: AppCopy): string {
  const days = (n: number | null) => (n == null ? '–' : a.daysN.replace('{n}', String(n)));
  const lines = [
    `${a.reportTitle}${name ? ` — ${name}` : ''}`,
    a.reportGenerated.replace('{date}', dateText(today, lang)),
    '',
    `${a.reportTypicalCycle}: ${days(s.averageCycleLength)}`,
    `${a.reportTypicalPeriod}: ${days(s.averagePeriodLength)}`,
    `${a.variationLabel}: ${days(s.cycleVariation)}`,
    `${a.reportCyclesLogged}: ${s.periods.length}`,
  ];
  const next = s.predictions[0];
  if (next) lines.push(`${a.reportNextPeriod}: ${rangeText(next.earliest, next.latest, lang)}`);
  if (s.notes.length) lines.push('', `${a.reportNotes}:`, ...s.notes.map((n) => `• ${noteText(n, a)}`));
  if (s.patterns.length) {
    lines.push(
      '',
      `${a.reportSymptoms}:`,
      ...s.patterns.map((p) => `• ${symptomLabel(p.symptom, a)} — ${phaseWhen(p.phase, a)} (${a.patternCount.replace('{n}', String(p.count))})`),
    );
  }
  if (s.periods.length) {
    lines.push('', `${a.reportCycles}:`);
    for (const p of s.periods) {
      const period = p.end ? `${dateText(p.start, lang)} – ${dateText(p.end, lang)} (${days(p.lengthDays)})` : `${dateText(p.start, lang)} (${a.ongoing})`;
      lines.push(`• ${period}${p.cycleLength ? ` · ${a.cycleOfN.replace('{n}', String(p.cycleLength))}` : ''}`);
    }
  }
  lines.push('', a.cycleDisclaimer);
  return lines.join('\n');
}

export default function CycleReportScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const a = APP_COPY[lang];
  const today = localDay();
  const female = user?.gender === 'female';
  const query = useCycleSummary(!female);

  if (!user) return <Screen />;
  if (!female) return <Redirect href="/dashboard" />;

  const s = query.data?.cycleSummary;
  const days = (n: number | null) => (n == null ? '–' : a.daysN.replace('{n}', String(n)));
  const share = () => {
    if (!s) return;
    void Share.share({ message: reportText(s, user.name, today, lang, a) }).catch(() => {});
  };

  return (
    <Screen
      header={<AppHeader title={a.reportTitle} subtitle={a.reportSub} backLabel={t.back} onBack={() => router.back()} />}
      footer={<PrimaryButton label={a.shareReport} onPress={share} disabled={!s} />}
    >
      {s ? (
        <>
          <FadeIn>
            <Section title={a.reportSummary}>
              <FactRow label={a.reportTypicalCycle} value={days(s.averageCycleLength)} />
              <FactRow label={a.reportTypicalPeriod} value={days(s.averagePeriodLength)} />
              <FactRow label={a.variationLabel} value={days(s.cycleVariation)} />
              <FactRow label={a.reportCyclesLogged} value={String(s.periods.length)} />
              {s.predictions[0] ? (
                <FactRow label={a.reportNextPeriod} value={rangeText(s.predictions[0].earliest, s.predictions[0].latest, lang)} />
              ) : null}
            </Section>
          </FadeIn>

          {s.notes.length ? (
            <>
              <Gap h={16} />
              <FadeIn delay={40}>
                <Section title={a.reportNotes.toUpperCase()}>
                  {s.notes.map((n) => (
                    <Text key={n} style={[T.fine, { color: c.text }]}>
                      • {noteText(n, a)}
                    </Text>
                  ))}
                </Section>
              </FadeIn>
            </>
          ) : null}

          {s.patterns.length ? (
            <>
              <Gap h={16} />
              <FadeIn delay={80}>
                <Section title={a.reportSymptoms.toUpperCase()}>
                  {s.patterns.map((p) => (
                    <FactRow
                      key={p.symptom}
                      label={symptomLabel(p.symptom, a)}
                      value={`${phaseWhen(p.phase, a)} · ${a.patternCount.replace('{n}', String(p.count))}`}
                    />
                  ))}
                </Section>
              </FadeIn>
            </>
          ) : null}

          <Gap h={16} />
          <FadeIn delay={120}>
            <Section title={a.reportCycles.toUpperCase()}>
              {s.periods.length ? (
                s.periods.map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 ? <Divider /> : null}
                    <View style={styles.row}>
                      <Text style={[T.body, { color: c.text, flex: 1 }]}>
                        {p.end ? `${dateText(p.start, lang)} – ${dateText(p.end, lang)}` : dateText(p.start, lang)}
                      </Text>
                      <Text style={[T.fine, { color: c.muted }]}>
                        {p.lengthDays ? days(p.lengthDays) : a.ongoing}
                        {p.cycleLength ? ` · ${a.cycleOfN.replace('{n}', String(p.cycleLength))}` : ''}
                      </Text>
                    </View>
                  </React.Fragment>
                ))
              ) : (
                <Text style={[T.fine, { color: c.faint }]}>{a.reportNoPeriods}</Text>
              )}
            </Section>
          </FadeIn>

          <Gap h={16} />
          <Text style={[T.fine, { color: c.faint }]}>{a.cycleDisclaimer}</Text>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
