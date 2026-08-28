// components/tab-bar.tsx — the floating bar, and the Log button in the middle.
//
// TWO IDEAS.
//
// It FLOATS. The bar is a rounded pill inset from the edges with content
// running under it, rather than a panel welded to the bottom of the screen.
// That is also what makes the iOS glass effect mean anything — glass refracts
// what is behind it, and there is nothing behind a bar that content stops
// short of.
//
// The MIDDLE BUTTON IS NOT A TAB. It opens the quick-log sheet. This app's
// entire job is recording small things — a glass of water, a dose, how you
// feel — and every one of those used to cost two or three taps through a
// screen you didn't otherwise want. The most-used action in the app now has
// the biggest target in the app, in the place your thumb already rests.
//
// It replaced More, which was a tab spent on a menu. A menu is not a
// destination; it is a delay before one.
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import GlassSurface, { useGlassEnabled } from '@/components/glass-surface';
import { PressableScale } from '@/components/motion';
import { TAB_ICONS, isVisibleTab } from '@/lib/tab-visibility';


// where the Log button sits in the row
const MIDDLE = 2;


function TabItem({
  icon, label, focused, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={6}>
      {/* The blob, not just a colour change. On a cheap screen in daylight a
          tint difference between two greys is invisible; a filled shape is
          not. */}
      <View style={[styles.blob, focused && { backgroundColor: `${c.primary}1A` }]}>
        <Ionicons
          name={icon}
          size={21}
          color={focused ? c.primary : c.textFaint}
        />
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: focused ? c.primary : c.textFaint, fontWeight: focused ? '800' : '600' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabBar({
  state, descriptors, navigation, onLog,
}: BottomTabBarProps & { onLog: () => void }) {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const glass = useGlassEnabled();

  const routes = state.routes.filter((route) => isVisibleTab(route.name, descriptors[route.key].options));

  const items = routes.map((route) => {
    const focused = state.routes[state.index].key === route.key;

    return (
      <TabItem
        key={route.key}
        icon={TAB_ICONS[route.name] as keyof typeof Ionicons.glyphMap}
        label={descriptors[route.key].options.title ?? route.name}
        focused={focused}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
      />
    );
  });

  // Slot the Log button into the middle of however many tabs there are. Men
  // have one fewer (no cycle), so a hard-coded index would put it off-centre
  // for half the users.
  const at = Math.min(MIDDLE, items.length);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: insets.bottom ? insets.bottom - 4 : 12 }]}
    >
      <View style={styles.pill}>
        {/* the surface: glass on iOS 26, a plain rounded card everywhere else */}
        {glass ? (
          <GlassSurface glassEffectStyle="regular" isInteractive style={StyleSheet.absoluteFill} radius={28} />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.solid,
              { backgroundColor: c.surface, borderColor: c.border, shadowColor: '#0B3A2A' },
            ]}
          />
        )}

        {items.slice(0, at)}

        {/* THE LOG BUTTON. Raised above the bar so it reads as an action rather
            than as a fifth place to go. */}
        <View style={styles.logSlot}>
          <PressableScale onPress={onLog} style={[styles.log, { backgroundColor: c.primary, shadowColor: c.primary }]}>
            <Ionicons name="add" size={28} color={c.onPrimary} />
          </PressableScale>
          <Text style={[styles.logLabel, { color: c.textFaint }]} numberOfLines={1}>{t.tabLog}</Text>
        </View>

        {items.slice(at)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 28,
  },
  solid: {
    borderRadius: 28,
    borderWidth: 1,
    // reads as floating rather than as a panel stuck to the bottom
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  blob: {
    width: 42, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 10, letterSpacing: 0.1 },

  logSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  log: {
    // lifted clear of the pill — half of it sits above the bar's top edge
    marginTop: -30,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  logLabel: { fontSize: 10, fontWeight: '700', marginTop: -2 },
});
