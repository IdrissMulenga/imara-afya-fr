import { useEffect, useState } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import useMe from '@/hooks/use-me';
import { getToken, isExpired } from '@/lib/tokens';
import TabBar from '@/components/tab-bar';
import QuickLogSheet from '@/components/quick-log-sheet';
import useHabits from '@/hooks/use-habits';
import useNotificationActions from '@/hooks/use-notification-actions';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';

export default function HomeLayout() {
  const { c } = useTheme();
  const { t } = useStrings();

  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    getToken()
      .then((token) => setAllowed(!!token && !isExpired(token)))
      .catch(() => setAllowed(false));
  }, []);


  const { me } = useMe({ skip: allowed !== true });
  const isWoman = me?.gender === 'Woman';

  const toast = useToast();

  useNotificationActions();

  const { addWater, summary, logging } = useHabits();

  const [logOpen, setLogOpen] = useState(false);

  const onLogWater = async () => {
    try {
      await addWater();
      toast.success(t.waterLogged);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
      throw err;
    }
  };

  if (allowed === false) return <Redirect href="/(auth)/login" />;

  if (allowed === null) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <>
    <Tabs
      tabBar={(props) => <TabBar {...props} onLog={() => setLogOpen(true)} />}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
        }}
      />

      <Tabs.Screen
        name="habits"
        options={{
          title: t.tabHabits,
        }}
      />

      <Tabs.Screen
        name="medications"
        options={{
          title: t.tabMeds,
        }}
      />

      <Tabs.Screen
        name="cycle"
        options={{
          title: t.tabCycle,
          // href: null removes the tab entirely for users who aren't women
          href: isWoman ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t.settingsTitle,
          href: isWoman ? null : undefined,
        }}
      />

      {/* reachable by push, but not shown in the tab bar */}
      <Tabs.Screen name="records" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="password" options={{ href: null }} />
      <Tabs.Screen name="routines" options={{ href: null }} />
      <Tabs.Screen name="check-in" options={{ href: null }} />
      <Tabs.Screen name="pregnancy" options={{ href: null }} />
    </Tabs>

    <QuickLogSheet
      open={logOpen}
      onClose={() => setLogOpen(false)}
      onLogWater={onLogWater}
      loggingWater={logging}
      waterToday={summary?.waterToday}
      waterGoal={summary?.waterGoal}
    />
    </>
  );
}
