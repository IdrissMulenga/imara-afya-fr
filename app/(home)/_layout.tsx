// app/(home)/_layout.tsx — signed-in area. Only the dashboard for now.
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
