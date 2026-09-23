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
        contentStyle: { backgroundColor: c.bg },
      }}
    />
  );
}
