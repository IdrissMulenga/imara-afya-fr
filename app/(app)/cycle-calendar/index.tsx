// Full cycle calendar: this month and the next two with estimates, then the last six
// months. Tapping a day opens its log.
import React from 'react';
import { View, Text } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Screen, Gap } from '@/components/screen';
import { AppHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { CalendarLegend, CycleMonth, useCycleDays, useCycleSummary } from '@/components/cycle';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { localDay } from '@/lib/steps';

const AHEAD = 2;
const BEHIND = 6;

export default function CycleCalendarScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user } = useSession();
  const a = APP_COPY[lang];
  const today = localDay();
  const female = user?.gender === 'female';

  const [y, m] = today.split('-').map(Number);
  const monthAt = (offset: number) => {
    const d = new Date(Date.UTC(y, m - 1 + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), key: `${d.getUTCFullYear()}-${d.getUTCMonth()}` };
  };
  const from = new Date(Date.UTC(y, m - 1 - BEHIND, 1)).toISOString().slice(0, 10);

  const summary = useCycleSummary(!female);
  const days = useCycleDays(from, today, !female);

  if (!user) return <Screen />;
  if (!female) return <Redirect href="/dashboard" />;

  const s = summary.data?.cycleSummary;
  const openDay = (day: string) => router.push({ pathname: '/cycle-day', params: { day } });
  const month = (offset: number, delay: number) => {
    const { year, month: mo, key } = monthAt(offset);
    return (
      <FadeIn key={key} delay={delay}>
        <Glass style={{ padding: 16 }}>
          <CycleMonth
            year={year}
            month={mo}
            summary={s!}
            logs={days.byDay}
            today={today}
            lang={lang}
            onPressDay={openDay}
            showTitle
          />
        </Glass>
        <Gap h={14} />
      </FadeIn>
    );
  };

  return (
    <Screen
      onRefresh={() => Promise.all([summary.refetch(), days.refetch()])}
      header={<AppHeader title={a.calendarPageTitle} subtitle={a.calendarPageSub} backLabel={t.back} onBack={() => router.back()} />}
    >
      <CalendarLegend a={a} />
      <Gap h={16} />
      {s ? (
        <>
          <Text style={[T.label, { color: c.faint, marginBottom: 10 }]}>{a.calendarAhead}</Text>
          {Array.from({ length: AHEAD + 1 }, (_, i) => month(i, i * 40))}
          <Text style={[T.label, { color: c.faint, marginTop: 8, marginBottom: 10 }]}>{a.calendarJourney}</Text>
          {Array.from({ length: BEHIND }, (_, i) => month(-(i + 1), 120 + i * 40))}
        </>
      ) : (
        <View style={{ height: 200 }} />
      )}
    </Screen>
  );
}
