// The blue header for in-app screens: HeaderShell, AppHeader (back + title)
// and ProfileHeader (dashboard). Sets light status-bar text while focused.
import React, { useCallback } from 'react';
import { View, Text, Pressable, Animated, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/panel';
import { useFade, usePressScale } from '@/components/motion';
import { useTheme } from '@/theme/theme';
import { type as T, font, welcome as W } from '@/theme/tokens';

/** A soft radial glow. id must be unique on screen. */
function Glow({
  id,
  size,
  colour,
  opacity,
  style,
}: {
  id: string;
  size: number;
  colour: string;
  opacity: number;
  style: { top?: number; bottom?: number; left?: number; right?: number };
}) {
  return (
    <Svg width={size} height={size} pointerEvents="none" style={[{ position: 'absolute' }, style]}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colour} stopOpacity={opacity} />
          <Stop offset="55%" stopColor={colour} stopOpacity={opacity * 0.45} />
          <Stop offset="100%" stopColor={colour} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** The coloured band every screen header sits in. */
export function HeaderShell({
  children,
  /** Extra space under the content. */
  roomy = false,
}: {
  children: React.ReactNode;
  roomy?: boolean;
}) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Light status-bar text while this screen is focused.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light', true);
      return () => setStatusBarStyle(isDark ? 'light' : 'dark', true);
    }, [isDark]),
  );

  return (
    // Outer view casts the shadow; the inner one clips the glows.
    <View
      style={[
        styles.shellShadow,
        Platform.OS === 'ios' ? styles.shellLift : { elevation: 10 },
      ]}
    >
      <View
        style={[
          styles.shell,
          {
            backgroundColor: W.bg,
            paddingTop: insets.top + 18,
            paddingBottom: roomy ? 30 : 24,
          },
        ]}
      >
        <Glow id="headerGreen" size={300} colour="#2EA34C" opacity={0.42} style={{ right: -80, top: -120 }} />
        <Glow id="headerBlue" size={230} colour="#5B9BE8" opacity={0.3} style={{ left: -90, bottom: -110 }} />

        {children}

        <View
          pointerEvents="none"
          style={[
            styles.shellEdge,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.09)' },
          ]}
        />
      </View>
    </View>
  );
}

/** Back button, title, optional subtitle. Every screen except the dashboard. */
export function AppHeader({
  title,
  subtitle,
  backLabel,
  onBack,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  /** Omit both for a page with no back button (the menu bar pages). */
  backLabel?: string;
  onBack?: () => void;
  /** A step marker, e.g. "2 / 3". */
  eyebrow?: string;
}) {
  return (
    <HeaderShell>
      {onBack ? <BackChip label={backLabel ?? ''} onPress={onBack} /> : null}

      <View style={{ marginTop: onBack ? 18 : 4, gap: 7 }}>
        {eyebrow ? (
          <Text style={[T.label, { color: W.inkFaint }]}>{eyebrow}</Text>
        ) : null}
        <Text
          style={{ fontFamily: font.displayBold, fontSize: 27, color: W.ink, letterSpacing: -0.5 }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[T.sub, { color: W.inkSoft, maxWidth: 320 }]}>{subtitle}</Text>
        ) : null}
      </View>
    </HeaderShell>
  );
}

/** Back button styled for the blue header. */
function BackChip({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePressScale(0.93);
  const [down, setDown] = React.useState(false);
  const lit = useFade(down, 120);

  return (
    <Animated.View style={[press.style, { alignSelf: 'flex-start' }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress();
        }}
        onPressIn={() => {
          setDown(true);
          press.onPressIn();
        }}
        onPressOut={() => {
          setDown(false);
          press.onPressOut();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={10}
        style={styles.backChip}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.backChipLit,
            { backgroundColor: '#FFFFFF', opacity: lit.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.26] }) },
          ]}
        />
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 5 L8 12 L15 19"
            stroke={W.ink}
            strokeWidth={2.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={[T.button, { color: W.ink }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** The dashboard header; the whole header opens the profile. */
export function ProfileHeader({
  greeting,
  name,
  email,
  photoUrl,
  badge,
  action,
  onPress,
}: {
  greeting: string;
  name?: string;
  email: string;
  photoUrl?: string | null;
  badge?: React.ReactNode;
  /** Read out by a screen reader in place of "button". */
  action: string;
  onPress: () => void;
}) {
  const press = usePressScale(0.99);
  const [down, setDown] = React.useState(false);
  const lit = useFade(down, 120);

  const display = (name || '').trim() || email;

  return (
    <HeaderShell roomy>
      <Animated.View style={press.style}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            setDown(true);
            press.onPressIn();
          }}
          onPressOut={() => {
            setDown(false);
            press.onPressOut();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${display} — ${action}`}
          style={styles.profileRow}
        >
          {/* Pressed highlight (kept faint). */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.profileLit,
              {
                backgroundColor: '#FFFFFF',
                opacity: lit.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              },
            ]}
          />

          <View style={styles.avatarRing}>
            <Avatar name={name} email={email} photoUrl={photoUrl} size={64} />
          </View>

          <View style={{ flex: 1, gap: 5 }}>
            <Text style={[T.fine, { color: W.inkFaint, letterSpacing: 0.4 }]} numberOfLines={1}>
              {greeting}
            </Text>
            <Text
              style={{ fontFamily: font.displayBold, fontSize: 23, color: W.ink, letterSpacing: -0.4 }}
              numberOfLines={1}
            >
              {display}
            </Text>
            {name ? (
              <Text style={[T.fine, { color: W.inkDim }]} numberOfLines={1}>
                {email}
              </Text>
            ) : null}
            {badge}
          </View>

          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 5 L16 12 L9 19"
              stroke={W.inkFaint}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </Animated.View>
    </HeaderShell>
  );
}

const styles = StyleSheet.create({
  shellShadow: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 2,
  },
  shellLift: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  shellEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  shell: {
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  backChip: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 19,
    overflow: 'hidden',
  },
  backChipLit: { borderRadius: 19 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 6,
    marginHorizontal: -6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileLit: { borderRadius: 20 },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
