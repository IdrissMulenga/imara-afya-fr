// app/(home)/_layout.tsx — signed-in area, bottom tab navigation.
//
// Tabs map to what the user touches daily:
//   Home    -> dashboard
//   Habits  -> habitSummary / logHabit
//   Meds    -> myMedications
//   Cycle   -> myCycles / cyclePrediction   (women only — hidden otherwise)
//   More    -> records, Ramadan mode, guidance, find care, profile
//
// Records / Ramadan / Profile are still real routes, just reached from More
// (and from the dashboard) rather than owning a tab — five is as many as fits
// comfortably on the entry-level Android screens we're targeting.
import { useEffect, useState } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import useMe from '@/hooks/use-me';
import { getToken, isExpired } from '@/lib/tokens';

export default function HomeLayout() {
  const { c } = useTheme();
  const { t } = useStrings();

  // GUARD.
  //
  // app/index.tsx is the real gate, but it isn't the only way in — a deep link,
  // or going back after signing out, can land here directly. This is a local
  // check only (no request): the server is what actually protects the data, and
  // anything this misses is caught by the error link on the first query.
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    getToken()
      .then((token) => setAllowed(!!token && !isExpired(token)))
      .catch(() => setAllowed(false));
  }, []);

  // the backend rejects every cycle query with WOMEN_ONLY for other users,
  // so the tab is hidden rather than shown and then erroring
  const { me } = useMe({ skip: allowed !== true });
  const isWoman = me?.gender === 'Woman';

  if (allowed === false) return <Redirect href="/(auth)/login" />;

  // Blank rather than a spinner: this resolves in milliseconds off local
  // storage, and a flash of loading UI on every tab mount would look broken.
  if (allowed === null) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // tabs cross-fade rather than slide — they're siblings, not a hierarchy
        animation: 'shift',
        // the scene sits behind every screen in this navigator and defaults to
        // white, which showed through as a flash during the shift animation and
        // behind the swipe-back gesture — jarring in dark mode especially
        sceneStyle: { backgroundColor: c.bg },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="habits"
        options={{
          title: t.tabHabits,
          tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="medications"
        options={{
          title: t.tabMeds,
          tabBarIcon: ({ color, size }) => <Ionicons name="medkit" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="cycle"
        options={{
          title: t.tabCycle,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
          // href: null removes the tab entirely for users who aren't women
          href: isWoman ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: t.tabMore,
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />

      {/* reachable by push, but not shown in the tab bar */}
      <Tabs.Screen name="records" options={{ href: null }} />
      <Tabs.Screen name="ramadan" options={{ href: null }} />
      <Tabs.Screen name="care" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
