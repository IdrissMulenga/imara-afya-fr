// The main pages as tabs under one persistent menu bar (components/menu-bar.tsx);
// the cycle tab is shown to women only.
import { Tabs } from 'expo-router';
import { TabDock } from '@/components/menu-bar';
import { useTheme } from '@/theme/theme';

export default function TabsLayout() {
  const { c } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <TabDock {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
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
