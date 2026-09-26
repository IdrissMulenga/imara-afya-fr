// Signed-in group. No navigator header: screens use components/header.tsx.
// contentStyle stops a white flash behind cards during swipe-back.
import { Stack } from 'expo-router';
import { useTheme } from '@/theme/theme';

export default function AppLayout() {
  const { c } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      {/* The tabs first: the first declared screen is the group's initial route. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="checkin-flow/index" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="cycle-day/index" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
