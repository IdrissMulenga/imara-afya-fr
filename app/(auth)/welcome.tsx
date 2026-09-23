// Welcome screen. Always deep blue, in both themes.
// The language rotates every 3.8s until the user picks one or moves on to a form.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LANGS, useLang, COPY, type Lang } from '@/theme/i18n';
import { welcome as W, font, radius, size } from '@/theme/tokens';
import { Wordmark } from '@/components/wordmark';
import { Glass } from '@/components/glass';

const CYCLE_MS = 3800;
const OUT_MS = 200;
const IN_MS = 320;

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, setLang, pinned, pin } = useLang();

  // Words fade and drift up on the way out, then rise in.
  const fade = useRef(new Animated.Value(1)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(false);

  // Highlight for each language pill.
  const fills = useRef(LANGS.map((code) => new Animated.Value(code === lang ? 1 : 0))).current;

  useEffect(() => {
    Animated.parallel(
      LANGS.map((code, i) =>
        Animated.timing(fills[i], {
          toValue: code === lang ? 1 : 0,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [lang, fills]);

  const swapTo = useCallback(
    (next: Lang, remember: boolean) => {
      if (busy) return;
      setBusy(true);

      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: OUT_MS, useNativeDriver: true }),
        Animated.timing(drift, {
          toValue: -10,
          duration: OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setLang(next, remember);
        drift.setValue(12);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: IN_MS, useNativeDriver: true }),
          Animated.timing(drift, {
            toValue: 0,
            duration: IN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => setBusy(false));
      });
    },
    [busy, fade, drift, setLang],
  );

  // Rotates only while this screen is focused and no language is pinned.
  useFocusEffect(
    useCallback(() => {
      if (pinned) return undefined;

      const timer = setInterval(() => {
        swapTo(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length], false);
      }, CYCLE_MS);

      return () => clearInterval(timer);
    }, [pinned, lang, swapTo]),
  );

  // Opening a form pins the language currently shown.
  const goTo = (path: '/(auth)/login' | '/(auth)/signup') => {
    pin();
    router.push(path);
  };

  const t = COPY[lang];
  const motion = { opacity: fade, transform: [{ translateY: drift }] };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 34 }]}>
      <StatusBar barStyle="light-content" backgroundColor={W.bg} />

      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.glowInner} pointerEvents="none" />
      <View style={styles.ring} pointerEvents="none" />

      <View style={styles.top}>

        <View style={styles.langRow}>
          {LANGS.map((code, i) => {
            const on = code === lang;
            return (
              <Pressable
                key={code}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  pin();
                  if (code !== lang) swapTo(code, true);
                }}
                accessibilityRole="button"
                accessibilityLabel={COPY[code].label}
                accessibilityState={{ selected: on }}
                hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
                style={styles.langPress}
              >
                <Animated.View
                  style={[
                    styles.langPill,
                    {
                      backgroundColor: fills[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(247,245,240,0.06)', W.ink],
                      }),
                      borderColor: fills[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(247,245,240,0.28)', W.ink],
                      }),
                    },
                  ]}
                >
                  <Animated.Text
                    numberOfLines={1}
                    style={[
                      styles.langLabel,
                      {
                        color: fills[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [W.inkSoft, W.onWhite],
                        }),
                      },
                    ]}
                  >
                    {COPY[code].label}
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 26 }} />

        <Wordmark onDark tagline={t.tagline} />

        <Animated.View style={[{ marginTop: 38 }, motion]}>
          <Text style={styles.h1}>
            {t.headA}
            {'\n'}
            {t.headB}
          </Text>
          <Text style={styles.sub}>{t.sub}</Text>
        </Animated.View>
      </View>

      <Glass tone="dark" intensity={18} style={styles.panel} radius={22}>
        <View style={styles.panelInner}>
          <Pressable
            onPress={() => goTo('/(auth)/signup')}
            accessibilityRole="button"
            accessibilityLabel={t.primary}
            style={({ pressed }) => [styles.primary, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Animated.Text style={[styles.primaryLabel, motion]}>{t.primary}</Animated.Text>
          </Pressable>

          <Pressable
            onPress={() => goTo('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel={t.secondary}
            style={({ pressed }) => [
              styles.secondary,
              { borderColor: pressed ? 'rgba(247,245,240,0.65)' : W.outline },
            ]}
          >
            <Animated.Text style={[styles.secondaryLabel, motion]}>{t.secondary}</Animated.Text>
          </Pressable>

          <Animated.Text style={[styles.legal, motion]}>{t.legal}</Animated.Text>
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: W.bg,
    justifyContent: 'space-between',
    paddingHorizontal: size.gutter,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -90,
    top: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(46,163,76,0.20)',
  },
  glowInner: {
    position: 'absolute',
    right: -30,
    top: 10,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(46,163,76,0.22)',
  },
  ring: {
    position: 'absolute',
    left: -70,
    bottom: 120,
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: W.ring,
  },
  top: { paddingTop: 18 },
  h1: {
    fontFamily: font.display,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1,
    color: W.ink,
  },
  sub: {
    marginTop: 18,
    maxWidth: 276,
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 23,
    color: W.inkSoft,
  },
  panel: { marginHorizontal: -6 },
  panelInner: { padding: 16, gap: 12 },
  langRow: { flexDirection: 'row', gap: 6 },
  langPress: { flex: 1 },
  langPill: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  // Sized so "Kiswahili" fits on a 360pt-wide phone.
  langLabel: { fontFamily: font.bodySemi, fontSize: 11.5, letterSpacing: 0.1 },
  primary: {
    height: size.control,
    borderRadius: radius.button,
    backgroundColor: W.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontFamily: font.bodySemi, fontSize: 15, color: W.onWhite },
  secondary: {
    height: size.control,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: { fontFamily: font.bodySemi, fontSize: 15, color: W.ink },
  legal: {
    marginTop: 4,
    marginHorizontal: 2,
    fontFamily: font.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: W.inkFaint,
  },
});
