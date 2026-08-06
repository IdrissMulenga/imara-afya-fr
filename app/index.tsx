// app/index.tsx — entry route / auth gate.
//
// Decides, while the logo is showing, whether this person is still signed in.
//
// "A token is stored" is NOT the same as "still signed in" — it may have
// expired, or been revoked by a logout elsewhere or a password change. Treating
// the two as equal is what used to drop people onto a dashboard full of empty
// cards with no way back to the login screen.
//
// The check is deliberately cheap first and networked second, because this runs
// on every cold start on a 2G connection:
//
//   no token            -> login
//   expired locally     -> login          (no request needed)
//   older than a day    -> refreshSession (renews it, and proves it's still good)
//   fresh               -> home           (any problem surfaces on the first query)
import { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { clearToken, getToken, isExpired, shouldRefresh } from '@/lib/tokens';
import useAuth from '@/hooks/use-auth';

export default function Index() {
  const { c } = useTheme();
  const { refresh } = useAuth();

  const [target, setTarget] = useState<'/(home)' | '/(auth)/login' | null>(null);

  // useAuth() hands back a new `refresh` on every render, so this effect must
  // not depend on it — and the gate should only ever run once per app start
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current) return;

    decided.current = true;

    (async () => {
      try {
        const token = await getToken();

        if (!token) {
          setTarget('/(auth)/login');
          return;
        }

        // Reading the expiry off the token is not verifying it — the app has no
        // secret to check the signature with. It only avoids a pointless round
        // trip for a token that is already, provably, past its date.
        if (isExpired(token)) {
          await clearToken();
          setTarget('/(auth)/login');
          return;
        }

        // Over a day old: renew it. This doubles as the server-side check, since
        // refreshSession only succeeds for a token that verified, hasn't been
        // revoked, and is inside the 30-day session cap.
        if (shouldRefresh(token)) {
          const renewed = await refresh();

          if (!renewed) {
            await clearToken();
            setTarget('/(auth)/login');
            return;
          }
        }

        setTarget('/(home)');
      } catch {
        // SecureStore unavailable, or anything else unexpected. Sending someone
        // to a login screen they can act on beats a splash that never resolves.
        setTarget('/(auth)/login');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
