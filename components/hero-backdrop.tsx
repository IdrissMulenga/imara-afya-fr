// components/hero-backdrop.tsx — the green top of every screen in the app.
//
// TWO EXPORTS, and most screens only need the second:
//
//   HeroBackdrop  the surface itself — photo or gradient, circles, curve
//   ScreenHeader  that surface plus the title/back-button row nearly every
//                 screen was hand-rolling a copy of
//
// Eleven screens each had their own `hero` style. They had drifted to four
// different bottom paddings and two different corner radii, none of them had
// the gradient or the circles the dashboard had, and adding anything to "the
// header" meant editing eleven files and missing one. Now there is one.
//
// THE SCRIM IS NOT OPTIONAL. White text straight onto a photograph is readable
// on the photograph you tested and unreadable on the next one — a dark wash
// underneath makes it a property of the layout rather than of the image.
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { PHOTOS, hasPhoto } from '@/constants/photos';
import { PressableScale } from '@/components/motion';

// THE HEIGHT OF EVERY HEADER IN THE APP, in one place.
//
// Standing off the status bar by this much, and this much air under the title.
// Both are deliberately generous — the headers used to be tight enough that the
// title sat almost on the curve, which made the app feel cramped at the top of
// every single screen.
export const HERO_TOP_GAP = 22;
export const HERO_BOTTOM_GAP = 32;
export const HERO_RADIUS = 32;

// SOFT CIRCLES BEHIND THE GREETING.
//
// They stop the gradient reading as a plain coloured rectangle, and they cost
// nothing to ship — no image, no download.
//
// EACH ONE IS ANCHORED TO AN EDGE IT CAN REACH. They used to be an SVG placing
// circles at percentage centres with fixed pixel radii, which only worked at
// the height the header happened to be that day: when the stat cards came out
// the header lost about 90px, a 120px circle centred at 6% of it ended up
// almost entirely above the top edge, and the texture vanished. Anchoring to
// top/bottom and letting the circle hang off the side means they stay where
// they were put however tall the header ends up.
//
// Plain Views rather than SVG. A circle is a square with half its width as the
// radius, and doing it this way means React Native's own layout does the
// positioning instead of a second coordinate system that has to be kept in
// step with the first.
const CIRCLES: ViewStyle[] = [
  // big one behind the avatar corner, hanging off the right edge
  { width: 190, height: 190, borderRadius: 95, top: -46, right: -58, opacity: 0.16 },
  // sits low on the left, anchored to the bottom so it survives any height
  { width: 132, height: 132, borderRadius: 66, bottom: -54, left: -30, opacity: 0.12 },
  // a small one to break the gap between the other two
  { width: 74, height: 74, borderRadius: 37, bottom: -14, right: 96, opacity: 0.1 },
];

function Texture() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {CIRCLES.map((circle, i) => (
        <View key={i} style={[styles.circle, circle]} />
      ))}
    </View>
  );
}

export default function HeroBackdrop({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();

  const photo = PHOTOS.hero;

  if (hasPhoto(photo)) {
    return (
      <View style={[styles.wrap, style]}>
        <Image source={photo} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {/* Darker at the top, where the greeting sits, easing off towards the
            bottom so the picture is still a picture rather than a grey panel. */}
        <LinearGradient
          colors={['rgba(6,42,30,0.82)', 'rgba(6,42,30,0.55)', 'rgba(6,42,30,0.72)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[c.heroFrom, c.heroMid, c.heroTo]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.wrap, style]}
    >
      <Texture />
      {children}
    </LinearGradient>
  );
}

/**
 * THE STANDARD HEADER: a title, optionally a back arrow and a line under it.
 *
 * The dashboard doesn't use this — it has a greeting and a floating avatar
 * instead — but it sits on the same HeroBackdrop, so the two stay the same
 * height, the same green and the same curve without either knowing about the
 * other.
 */
export function ScreenHeader({
  title,
  subtitle,
  back = false,
  /** where the arrow goes when there is nothing to go back to */
  fallback = '/(home)',
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  fallback?: string;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <HeroBackdrop
      style={{
        paddingHorizontal: 22,
        paddingTop: insets.top + HERO_TOP_GAP,
        paddingBottom: HERO_BOTTOM_GAP,
      }}
    >
      <View style={styles.titleRow}>
        {back && (
          // GUARD THE ACTION, NOT THE BUTTON. `router.canGoBack()` is evaluated
          // during render, and tab screens stay mounted — so a stale `false`
          // used to hide the way out of a screen entirely. The arrow always
          // shows; where it goes is decided when it is pressed.
          <PressableScale
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace(fallback as never);
            }}
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </PressableScale>
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {right}
      </View>

      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </HeroBackdrop>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // clips both the photo and the texture to the curve
    overflow: 'hidden',
    borderBottomLeftRadius: HERO_RADIUS,
    borderBottomRightRadius: HERO_RADIUS,
  },
  // the per-circle position, size and opacity come from CIRCLES above
  circle: { position: 'absolute', backgroundColor: '#fff' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtn: { marginLeft: -6, padding: 2 },
  title: { flex: 1, color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13.5, fontWeight: '500', marginTop: 8,
  },
});
