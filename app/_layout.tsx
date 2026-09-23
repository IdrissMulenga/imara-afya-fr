// Root layout: providers, fonts, and routing between the auth and app groups.
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { ApolloProvider } from '@apollo/client/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { client } from '@/lib/apollo';
import { NoticeProvider } from '@/components/notice';
import { SessionProvider, useSession } from '@/lib/session';
import { ThemeProvider, useTheme } from '@/theme/theme';
import { LanguageProvider, useLang } from '@/theme/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Shows render errors instead of a blank screen.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  console.error('[screen crashed]', error?.message, '\n', error?.stack);

  return (
    <View style={{ flex: 1, backgroundColor: '#13233A', padding: 24, justifyContent: 'center', gap: 14 }}>
      <Text style={{ color: '#FF8A8A', fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>
        THIS SCREEN CRASHED
      </Text>
      <Text style={{ color: '#F6F7F9', fontSize: 15, lineHeight: 22 }}>
        {error?.message ?? 'No message'}
      </Text>
      <Text style={{ color: 'rgba(246,247,249,0.55)', fontSize: 11, lineHeight: 16 }}>
        {(error?.stack ?? '').split('\n').slice(0, 8).join('\n')}
      </Text>
      <Text onPress={retry} style={{ color: '#7FB0FF', fontSize: 15, marginTop: 8 }}>
        Try again
      </Text>
    </View>
  );
}

/** Longest wait for fonts and the session before rendering anyway. */
const PATIENCE_MS = 3500;

// True once ms milliseconds have passed.
function useTimeout(ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setElapsed(true), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return elapsed;
}

// Redirects the user to the auth or app group.
function Gate() {
  const { user, ready } = useSession();
  const { ready: langReady } = useLang();
  const { c, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const patienceGone = useTimeout(PATIENCE_MS);

  const booted = (ready && langReady) || patienceGone;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!booted) return;

    const path = segments as readonly string[];
    const inAuth = path[0] === '(auth)';
    const inApp = path[0] === '(app)';

    // A signed-in user may stay on verify to confirm their email.
    const confirmingEmail = inAuth && path[1] === 'verify';

    if (!user && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (user && !inApp && !confirmingEmail) {
      router.replace('/(app)');
    }
  }, [booted, user, segments, router]);

  if (!booted) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: c.bg },
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });
  const patienceGone = useTimeout(PATIENCE_MS);

  if (!fontsLoaded && !fontError && !patienceGone) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <ThemeProvider>
          <LanguageProvider>
            <NoticeProvider>
              <SessionProvider>
                <Gate />
              </SessionProvider>
            </NoticeProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
