// Bottom menu for the three main pages: Home, Profile and Settings.
// Pass it as <Screen menu={<MenuBar active="home" />}>.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';

export type MenuTab = 'home' | 'profile' | 'settings';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const HREF = { home: '/(app)/dashboard', profile: '/(app)/me', settings: '/(app)/settings' } as const;

export function MenuBar({ active }: { active: MenuTab }) {
  const router = useRouter();
  const { lang } = useLang();
  const a = APP_COPY[lang];

  // Home returns to the dashboard already in the stack; from Home the others are
  // pushed (so back returns Home), and between them they replace each other.
  const go = (tab: MenuTab) => {
    if (tab === active) return;
    Haptics.selectionAsync().catch(() => {});
    if (tab === 'home') router.dismissTo(HREF.home);
    else if (active === 'home') router.push(HREF[tab]);
    else router.replace(HREF[tab]);
  };

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      <Item label={a.menuHome} icon="home-variant" on={active === 'home'} onPress={() => go('home')} />
      <Item label={a.menuProfile} icon="account-circle" on={active === 'profile'} onPress={() => go('profile')} />
      <Item label={a.settings} icon="cog" on={active === 'settings'} onPress={() => go('settings')} />
    </View>
  );
}

// One tab: a filled icon over its label. The active tab sits in its own capsule.
function Item({
  label,
  icon,
  on,
  onPress,
}: {
  label: string;
  icon: IconName;
  on: boolean;
  onPress: () => void;
}) {
  const { c, isDark } = useTheme();
  const color = on ? c.primary : c.text;
  const capsule = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(19,35,58,0.07)';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [
        styles.item,
        on ? { backgroundColor: capsule } : null,
        pressed && !on ? styles.pressed : null,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={26} color={color} />
      <Text style={[styles.label, { color, fontFamily: font.bodySemi }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row' },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 8,
    borderRadius: 999,
  },
  label: { fontSize: 12 },
  pressed: { opacity: 0.6 },
});
