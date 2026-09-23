// Entry route: redirects to the auth or app group.
import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/theme';

export default function Index() {
  const { user, ready } = useSession();
  const { c } = useTheme();

  // Storage not read yet: show a themed blank view.
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return <Redirect href={user ? '/(app)' : '/(auth)/welcome'} />;
}
