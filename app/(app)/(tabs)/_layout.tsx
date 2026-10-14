// The main pages as tabs. iOS: the system tab bar (Liquid Glass on iOS 26 and later, with SF
// Symbols). Android: the menu in components/menu-bar.tsx. The cycle tab is shown to women only.
import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { TabDock } from '@/components/menu-bar';
import { useTheme } from '@/theme/theme';
import { useLang } from '@/theme/i18n';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';

/** iOS: the system tab bar, which shrinks while the page scrolls down. */
function IosTabs() {
  const { c } = useTheme();
  const { lang } = useLang();
  const { user } = useSession();
  const a = APP_COPY[lang];

  return (
    <NativeTabs tintColor={c.primary} minimizeBehavior="onScrollDown">
      {/* dashboard first: the first declared screen is the initial tab. */}
      <NativeTabs.Trigger name="dashboard/index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{a.menuHome}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="checkin/index">
        <NativeTabs.Trigger.Icon sf={{ default: 'face.smiling', selected: 'face.smiling.inverse' }} />
        <NativeTabs.Trigger.Label>{a.menuCheckIn}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sleep/index">
        <NativeTabs.Trigger.Icon sf={{ default: 'bed.double', selected: 'bed.double.fill' }} />
        <NativeTabs.Trigger.Label>{a.menuSleep}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cycle/index" hidden={user?.gender !== 'female'}>
        <NativeTabs.Trigger.Icon sf={{ default: 'drop', selected: 'drop.fill' }} />
        <NativeTabs.Trigger.Label>{a.menuCycle}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings/index">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <NativeTabs.Trigger.Label>{a.settings}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabsLayout() {
  const { c } = useTheme();
  const { lang } = useLang();

  if (Platform.OS === 'ios') return <IosTabs />;

  return (
    <Tabs
      tabBar={(props) => <TabDock {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
      // Redraws each tab when the language changes, so numbers already shown follow it.
      screenLayout={({ children }) => <React.Fragment key={lang}>{children}</React.Fragment>}
    >
      {/* dashboard first: the first declared screen is the initial tab. */}
      <Tabs.Screen name="dashboard/index" />
      <Tabs.Screen name="checkin/index" />
      <Tabs.Screen name="sleep/index" />
      <Tabs.Screen name="cycle/index" />
      <Tabs.Screen name="settings/index" />
    </Tabs>
  );
}
