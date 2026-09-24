// Dashboard: today's steps, water and sleep against the user's goals.
import React, { useCallback, useRef } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Gap } from '@/components/screen';
import { QuietButton } from '@/components/ui';
import { NavRow, Badge } from '@/components/panel';
import { TodayCard, useHabitSummary } from '@/components/habits';
import { ProfileHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { MenuBar } from '@/components/menu-bar';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, greetingFor } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { syncHealth } from '@/lib/sync';

export default function Dashboard() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, refreshUser } = useSession();

  const a = APP_COPY[lang];

  const { data: habits, refetch: refetchHabits } = useHabitSummary();

  // Refresh on return to this screen (skipping the first focus, which already fetched),
  // so the day rolls over after midnight.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void refetchHabits();
      focusedOnce.current = true;
    }, [refetchHabits]),
  );

  // The user can be null briefly while signing out.
  if (!user) return <Screen />;

  const firstName = (user.name || '').trim().split(/\s+/)[0] || '';

  return (
    <Screen
      onRefresh={() => Promise.all([refetchHabits(), syncHealth(), refreshUser()])}
      header={
        <ProfileHeader
          greeting={`${greetingFor(a)}${firstName ? ',' : ''}`}
          name={user.name}
          email={user.email}
          photoUrl={user.photoUrl}
          action={a.menuProfile}
          onPress={() => router.push('/(app)/me')}
          badge={
            !user.emailVerified ? <Badge text={a.unverifiedShort} tone="bad" /> : undefined
          }
        />
      }
      menu={<MenuBar active="home" />}
    >
      <FadeIn>
        <Text style={[T.sub, { color: c.muted, maxWidth: 330 }]}>{a.dashSub}</Text>
      </FadeIn>

      {!user.emailVerified ? (
        <FadeIn delay={110}>
          <Gap h={18} />
          <Glass style={{ padding: 16 }}>
            <View style={{ gap: 12 }}>
              <Badge text={a.unverifiedShort} tone="bad" />
              <Text style={[T.body, { color: c.muted }]}>{t.unverified}</Text>
              <QuietButton
                label={a.confirmNow}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/verify',
                    params: { email: user.email, masked: user.email, purpose: 'SIGNUP' },
                  })
                }
              />
            </View>
          </Glass>
        </FadeIn>
      ) : null}

      <Gap h={22} />

      <FadeIn delay={160}>
        <View style={{ gap: 10 }}>
          <Text style={[T.label, { color: c.faint, marginLeft: 2 }]}>{a.habitsToday}</Text>
          <TodayCard user={user} summary={habits?.habitSummary} />
          <Glass style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <NavRow
              label={a.seeHistory}
              hint={a.seeHistorySub}
              onPress={() => router.push('/(app)/steps')}
            />
          </Glass>
        </View>
      </FadeIn>
    </Screen>
  );
}
