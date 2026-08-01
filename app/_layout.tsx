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
              {/* slide feels more like moving through the app than a cross-fade,
                  and Reanimated keeps it on the UI thread */}
              <Stack screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 260,
                gestureEnabled: true
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
