// Signed-in group. No navigator header: screens use components/header.tsx.
// contentStyle stops a white flash behind cards during swipe-back.
import { Stack } from 'expo-router';
import { useTheme } from '@/theme/theme';

// The menu bar pages switch instantly, like tabs, instead of sliding.
const MENU_PAGE = { animation: 'slide_from_right' } as const;

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
      {/* dashboard first: the first declared screen is the group's initial route. */}
      <Stack.Screen name="dashboard" options={MENU_PAGE} />
      <Stack.Screen name="me" options={MENU_PAGE} />
      <Stack.Screen name="settings" options={MENU_PAGE} />
    </Stack>
  );
}
