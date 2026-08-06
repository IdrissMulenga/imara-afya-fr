import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import client, { ApolloWrapper } from '@/lib/apollo';
import { ThemeProvider, useTheme } from '@/constants/theme';
import { LangProvider } from '@/constants/strings';
import { ToastProvider } from '@/components/toast';
import { onSessionEnd } from '@/lib/session';


// Listens for a token dying mid-session — the 7-day expiry passing, a logout on
// another device, a password change — and gets the user back to the login
// screen. Rendered inside the providers so it stays mounted for the whole app
// run, and renders nothing itself.
function SessionWatcher() {
  useEffect(() => onSessionEnd(() => {
    // drop cached health data before navigating: it belongs to a session that
    // no longer exists, and the login screen shouldn't be able to show it
    void client.clearStore();
    router.replace('/(auth)/login');
  }), []);

  return null;
}


// Its own component because it needs the theme, and RootLayout sits above
// ThemeProvider — a hook there would read nothing.
function RootStack() {
  const { c } = useTheme();

  return (
    // slide feels more like moving through the app than a cross-fade, and
    // Reanimated keeps it on the UI thread
    <Stack screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      animationDuration: 260,
      // native edge-swipe, iOS only — Android and the tab screens are covered
      // by components/swipe-back.tsx instead
      gestureEnabled: true,
      // the gap behind a sliding screen defaults to white, which flashes on
      // every push and is glaring in dark mode
      contentStyle: { backgroundColor: c.bg },
    }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(home)" />
    </Stack>
  );
}


export default function RootLayout() {
  return (
    // Required by react-native-gesture-handler on Android — without it the
    // swipe-back gesture silently does nothing there, which is the one platform
    // that has no native back gesture to fall back on.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloWrapper>
        <SessionWatcher />
        <SafeAreaProvider>
          <ThemeProvider initialPalette="forest">
            <LangProvider initialLang="en">
              {/* ToastProvider sits inside theme + safe-area so it can use both */}
              <ToastProvider>
                <StatusBar style="auto" />
                <RootStack />
              </ToastProvider>
            </LangProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ApolloWrapper>
    </GestureHandlerRootView>
  );
}
