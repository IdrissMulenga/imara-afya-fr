// Continue with Google and Sign in with Apple, above the email form. iOS shows Apple's own button
// and Google's; Android shows Google's only. A new account goes on to "About you".
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '@/components/pressable';
import { useNotice } from '@/components/notice';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { font, radius, size } from '@/theme/tokens';
import { setNextLanding, useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { getDeviceCredentials } from '@/lib/device';
import { appleCredential, appleStatus, googleIdToken, useGoogleAvailable } from '@/lib/social';
import { SIGN_IN_WITH_APPLE, SIGN_IN_WITH_GOOGLE, type AuthPayload } from '@/graphql/auth';

// Google's "G", in its brand colours.
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

/** The Google / Apple buttons, then an "or" line; nothing when neither can run here. */
export function SocialButtons({
  onDark = false,
  showGoogle = true,
}: {
  onDark?: boolean;
  /** False leaves out the Google button (the welcome screen shows Apple only). */
  showGoogle?: boolean;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const { isDark } = useTheme();
  const { signIn } = useSession();
  const { failure } = useNotice();

  const [appleWhy, setAppleWhy] = useState('');
  const apple = appleWhy === 'ok';
  // In development the Google button shows even where it cannot run yet (Expo Go, or no client
  // id), so the screens can be reviewed; release builds show it only when it works.
  const googleReady = useGoogleAvailable();
  // App Store guideline 4.8: an iPhone app offering Google sign-in must also offer Sign in with
  // Apple, so on iOS Google shows only when Apple does.
  const allowedHere = Platform.OS !== 'ios' || apple;
  const google = showGoogle && ((googleReady && allowedHere) || __DEV__);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  const [withGoogle] = useMutation<{ signInWithGoogle: AuthPayload }>(SIGN_IN_WITH_GOOGLE);
  const [withApple] = useMutation<{ signInWithApple: AuthPayload }>(SIGN_IN_WITH_APPLE);

  useEffect(() => {
    let alive = true;
    appleStatus().then((status) => {
      if (alive) setAppleWhy(status);
    });
    return () => {
      alive = false;
    };
  }, []);

  // In development on iPhone, says why the Apple button is missing.
  const appleNote =
    __DEV__ && Platform.OS === 'ios' && appleWhy && !apple ? `Apple: ${appleWhy}` : '';

  if (!google && !apple && !appleNote) return null;

  // A new account lands on "About you"; the root gate opens it once the session is stored.
  const finish = async (payload: AuthPayload | undefined) => {
    if (!payload) return;
    if (payload.newAccount) {
      setNextLanding('/about-you');
      await signIn(payload);
      return;
    }
    await signIn(payload);
    router.replace('/dashboard');
  };

  const run = async (which: 'google' | 'apple') => {
    if (busy) return;
    setBusy(which);
    try {
      const device = await getDeviceCredentials();
      if (which === 'google') {
        if (!googleReady || !allowedHere) {
          failure(
            'Google sign-in is not set up here yet',
            'It needs GOOGLE_WEB_CLIENT_ID on the server and the app’s own build (not Expo Go); on iPhone, Sign in with Apple too.'
          );
          return;
        }
        const idToken = await googleIdToken();
        if (!idToken) return;
        const { data } = await withGoogle({
          variables: { input: { idToken, ...device, language: lang } },
        });
        await finish(data?.signInWithGoogle);
      } else {
        const credential = await appleCredential();
        if (!credential) return;
        const { data } = await withApple({
          variables: { input: { ...credential, ...device, language: lang } },
        });
        await finish(data?.signInWithApple);
      }
    } catch (error) {
      failure(errorMessage(error, lang));
    } finally {
      setBusy(null);
    }
  };

  // Google's brand colours: light button on a light or blue screen, dark on a dark screen.
  const googleDark = isDark && !onDark;
  const lineColor = onDark ? 'rgba(247,245,240,0.28)' : isDark ? 'rgba(255,255,255,0.16)' : 'rgba(19,35,58,0.14)';
  const orColor = onDark ? 'rgba(247,245,240,0.6)' : isDark ? '#9CA2AC' : '#5C6B7F';

  return (
    <View style={styles.wrap}>
      {apple ? (
        <View pointerEvents={busy ? 'none' : 'auto'} style={{ opacity: busy === 'google' ? 0.5 : 1 }}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              onDark || isDark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={radius.button}
            style={styles.button}
            onPress={() => run('apple')}
          />
        </View>
      ) : null}

      {appleNote ? <Text style={[styles.devNote, { color: orColor }]}>{appleNote}</Text> : null}

      {google ? (
        <Pressable
          onPress={() => run('google')}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel={t.continueGoogle}
          style={({ pressed }) => [
            styles.button,
            styles.google,
            googleDark
              ? { backgroundColor: '#131314', borderColor: '#8E918F' }
              : { backgroundColor: '#FFFFFF', borderColor: '#747775' },
            { opacity: busy === 'apple' ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          {busy === 'google' ? (
            <ActivityIndicator color={googleDark ? '#E3E3E3' : '#1F1F1F'} />
          ) : (
            <>
              <GoogleMark />
              <Text style={[styles.googleLabel, { color: googleDark ? '#E3E3E3' : '#1F1F1F' }]}>
                {t.continueGoogle}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}

      <View style={styles.or}>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
        <Text style={[styles.orText, { color: orColor }]}>{t.orDivider}</Text>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  button: { height: size.control, width: '100%', borderRadius: radius.button },
  google: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleLabel: { fontFamily: font.bodySemi, fontSize: 15 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: { fontFamily: font.bodyMedium, fontSize: 13 },
  devNote: { fontFamily: font.body, fontSize: 12, textAlign: 'center' },
});
