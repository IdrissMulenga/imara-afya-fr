// Signed-in group. No navigator header: screens use components/header.tsx.
// contentStyle stops a white flash behind cards during swipe-back.
import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/theme/theme';
import { useLang } from '@/theme/i18n';

export default function AppLayout() {
  const { c } = useTheme();
  const { lang } = useLang();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Each phone's own page transition and back gesture.
        animation: 'default',
        contentStyle: { backgroundColor: c.bg },
      }}
      // Redraws each screen when the language changes, so numbers already shown follow it.
      screenLayout={({ children }) => <React.Fragment key={lang}>{children}</React.Fragment>}
    >
      {/* The tabs first: the first declared screen is the group's initial route. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="checkin-flow/index" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="cycle-day/index" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
