import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { ApolloWrapper } from '@/lib/apollo';
import { ThemeProvider } from '@/constants/theme';
import { LangProvider } from '@/constants/strings';
import { ToastProvider } from '@/components/toast';


export default function RootLayout() {
  return (
    <ApolloWrapper>
      <SafeAreaProvider>
        <ThemeProvider initialPalette="forest">
          <LangProvider initialLang="en">
            {/* ToastProvider sits inside theme + safe-area so it can use both */}
            <ToastProvider>
              <StatusBar style="auto" />
              <Stack screenOptions={{
                headerShown: false,
                animation: 'fade'
              }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(home)" />
              </Stack>
            </ToastProvider>
          </LangProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ApolloWrapper>
  );
}
