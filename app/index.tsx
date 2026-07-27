// app/index.tsx — entry route / auth gate.
// Shows the logo briefly while we check for a stored token, then sends the user
// to the dashboard (already signed in) or to login.
import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { getToken } from '@/lib/tokens';

export default function Index() {
  const { c } = useTheme();
  const [target, setTarget] = useState<'/(home)' | '/(auth)/login' | null>(null);

  useEffect(() => {
    getToken()
      .then((token) => setTarget(token ? '/(home)' : '/(auth)/login'))
      .catch(() => setTarget('/(auth)/login'));
  }, []);

  // <Redirect> (not router.replace) so navigation waits for the root layout
  if (target) return <Redirect href={target} />;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Image source={require('../assets/logo.png')} resizeMode="contain" style={styles.logo} />
      <ActivityIndicator color={c.primary} style={{ marginTop: 26 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 96, height: 96 },
});
