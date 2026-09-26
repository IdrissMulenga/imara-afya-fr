// Floating menu under the main tabs: a pill slides to the tapped tab, whose outline icon
// fills in its own colour. The cycle tab is shown to women only.
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Glass } from '@/components/glass';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SLEEP_COLOR } from '@/components/habit-art';
import { useReducedMotion } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/theme';
import { font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Tabs in menu order: the page folder, the filled and outline icons, and the tab's colour.
const TABS: { route: string; icon: IconName; outline: IconName; color: string }[] = [
  { route: 'dashboard', icon: 'home-variant', outline: 'home-variant-outline', color: '#3B82F6' },
  { route: 'checkin', icon: 'emoticon-happy', outline: 'emoticon-happy-outline', color: '#E8A33D' },
  { route: 'sleep', icon: 'bed', outline: 'bed-outline', color: SLEEP_COLOR },
  { route: 'cycle', icon: 'flower', outline: 'flower-outline', color: '#E0527E' },
  { route: 'settings', icon: 'cog', outline: 'cog-outline', color: '#F07A3A' },
];

// Route names are the page files ("dashboard/index"); the menu matches them by folder.
const folderOf = (routeName: string | undefined) => (routeName ?? '').replace(/\/index$/, '');

const SPRING = { damping: 17, stiffness: 170, mass: 0.9 };
const DOCK_PADDING = 5;
const ITEM_HEIGHT = 58;
// Radius large enough to make the menu a pill whatever its height.
const PILL = 999;

/** Where the floating menu sits: its distance from the bottom edge and its height. */
export function useMenuSpace(): { bottom: number; height: number } {
  const insets = useSafeAreaInsets();
  // Just above the home indicator / gesture bar, overlapping part of its empty inset,
  // with a small margin on phones that have none.
  return { bottom: Math.max(insets.bottom - 10, 10), height: ITEM_HEIGHT + DOCK_PADDING * 2 + 2 };
}

// Whether the keyboard is on screen; the menu hides while typing.
function useKeyboardUp(): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setUp(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return up;
}

/** The floating glass pill holding the menu. */
export function TabDock({ state, navigation }: TabBarProps) {
  const { isDark } = useTheme();
  const space = useMenuSpace();
  const keyboardUp = useKeyboardUp();
  // The glass rim: a light edge in dark mode, a faint dark one in light mode.
  const rim = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(19,35,58,0.08)';

  if (keyboardUp) return null;

  const bar = <MenuBar state={state} navigation={navigation} />;
  // iOS: real blur, shadow on the wrapper (Glass clips). Android: a translucent fill (blur
  // is too slow on low-end phones) carrying its own elevation.
  return (
    <View style={[styles.dock, { bottom: space.bottom }, Platform.OS === 'ios' ? styles.liftIOS : null]}>
      {Platform.OS === 'ios' ? (
        <Glass intensity={80} radius={PILL} flat style={[styles.inner, { borderWidth: 1, borderColor: rim }]}>
          {bar}
        </Glass>
      ) : (
        <View
          style={[
            styles.inner,
            styles.liftAndroid,
            {
              borderRadius: PILL,
              backgroundColor: isDark ? 'rgba(38,39,42,0.94)' : 'rgba(255,255,255,0.94)',
              borderWidth: 1,
              borderColor: rim,
            },
          ]}
        >
          {bar}
        </View>
      )}
    </View>
  );
}

function MenuBar({ state, navigation }: Pick<TabBarProps, 'state' | 'navigation'>) {
  const { lang } = useLang();
  const { user } = useSession();
  const reduced = useReducedMotion();
  const a = APP_COPY[lang];
  const labels: Record<string, string> = {
    dashboard: a.menuHome,
    checkin: a.menuCheckIn,
    sleep: a.menuSleep,
    cycle: a.menuCycle,
    settings: a.settings,
  };

  const female = user?.gender === 'female';
  const tabs = female ? TABS : TABS.filter((t) => t.route !== 'cycle');
  const stops = tabs.map((_, i) => i);
  const pillColors = tabs.map((t) => `${t.color}24`);

  const activeFolder = folderOf(state.routes[state.index]?.name);
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.route === activeFolder));
  const pos = useSharedValue(activeIndex);
  const [width, setWidth] = useState(0);

  const slideTo = (index: number) => {
    pos.value = reduced ? index : withSpring(index, SPRING);
  };

  // Follows tab changes made elsewhere (links, notifications, back).
  useEffect(() => {
    pos.value = reduced ? activeIndex : withSpring(activeIndex, SPRING);
  }, [activeIndex, reduced, pos]);

  const press = (index: number) => {
    const route = state.routes.find((r) => folderOf(r.name) === tabs[index].route);
    if (!route) return;
    const focused = index === activeIndex;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (focused || event.defaultPrevented) return;
    Haptics.selectionAsync().catch(() => {});
    slideTo(index);
    navigation.navigate(route.name, route.params);
  };

  const itemWidth = width / tabs.length;
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * itemWidth }],
    backgroundColor: interpolateColor(pos.value, stops, pillColors),
  }));

  return (
    <View
      style={styles.bar}
      accessibilityRole="tablist"
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            { width: itemWidth },
            pillStyle,
          ]}
        />
      ) : null}
      {tabs.map(({ route, icon, outline, color }, index) => (
        <Item
          key={route}
          index={index}
          pos={pos}
          label={labels[route]}
          icon={icon}
          outline={outline}
          color={color}
          on={index === activeIndex}
          onPress={() => press(index)}
        />
      ))}
    </View>
  );
}

// One tab. How "active" it looks follows how close the pill is to it.
function Item({
  index,
  pos,
  label,
  icon,
  outline,
  color,
  on,
  onPress,
}: {
  index: number;
  pos: SharedValue<number>;
  label: string;
  icon: IconName;
  outline: IconName;
  color: string;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const squeeze = useSharedValue(1);
  const near = useDerivedValue(() => 1 - Math.min(1, Math.abs(pos.value - index)));
  const idle = c.muted;

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -2 * near.value }, { scale: (1 + 0.1 * near.value) * squeeze.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({ color: interpolateColor(near.value, [0, 1], [idle, color]) }));
  const filledStyle = useAnimatedStyle(() => ({ opacity: near.value }));
  const outlineStyle = useAnimatedStyle(() => ({ opacity: 1 - near.value }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        squeeze.value = withTiming(0.86, { duration: 90 });
      }}
      onPressOut={() => {
        squeeze.value = withSpring(1, { damping: 10, stiffness: 300 });
      }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={styles.item}
    >
      <Animated.View style={[styles.icon, iconStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, outlineStyle]}>
          <MaterialCommunityIcons name={outline} size={26} color={idle} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, filledStyle]}>
          <MaterialCommunityIcons name={icon} size={26} color={color} />
        </Animated.View>
      </Animated.View>
      <Animated.Text style={[styles.label, { fontFamily: font.bodySemi }, labelStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 36, right: 36 },
  inner: { padding: DOCK_PADDING },
  liftIOS: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  liftAndroid: { elevation: 14 },
  bar: { flexDirection: 'row' },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: PILL },
  item: { flex: 1, height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { width: 28, height: 28 },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10 },
});
