import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { ThemeProvider } from '@/constants/theme';
import { LangProvider } from '@/constants/strings';


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialPalette="forest">
        <LangProvider initialLang="en">
          <StatusBar style="auto" />
          <Stack screenOptions={{
            headerShown: false,
            animation: 'fade'
          }}>
            <Stack.Screen name="(auth)" />
            {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
          </Stack>
        </LangProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
