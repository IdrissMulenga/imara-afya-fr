// Shared notification setup: availability (off in Expo Go), permission, on/off stores, and
// opening the right page when a notification is tapped.
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { useRouter, type Href } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import type { NotificationResponse } from 'expo-notifications';

/** True when local notifications can be used (a phone build, not Expo Go). */
export const supported = (Platform.OS === 'android' || Platform.OS === 'ios') && !isRunningInExpoGo();

// Loaded only when supported; every use must be behind a `supported` check.
export const Notifications = (supported ? require('expo-notifications') : null) as typeof import('expo-notifications');

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for notification permission if needed. True when granted. */
export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** True when permission is already granted (never prompts). */
export async function hasPermission(): Promise<boolean> {
  if (!supported) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

// A tap that launched the app is only acted on if this recent (older ones were handled
// on an earlier start).
const LAUNCH_FRESH_MS = 2 * 60 * 1000;
// Gives the start-up redirect to the dashboard time to finish first.
const LAUNCH_DELAY_MS = 600;

/** Opens a page when a notification is tapped, chosen from its data.kind; also for the tap
 *  that launched the app, once `ready` (the user is signed in). */
export function useNotificationRoutes(routes: Record<string, Href>, ready: boolean): void {
  const router = useRouter();
  const latest = useRef(routes);
  latest.current = routes;

  const routeFor = (response: NotificationResponse | null): Href | null => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
    const kind = response.notification.request.content.data?.kind;
    return typeof kind === 'string' ? (latest.current[kind] ?? null) : null;
  };

  useEffect(() => {
    if (!supported) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeFor(response);
      if (route) router.push(route);
    });
    return () => sub.remove();
  }, [router]);

  const launchHandled = useRef(false);
  useEffect(() => {
    if (!supported || !ready || launchHandled.current) return;
    launchHandled.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const route = routeFor(response);
      if (route && response && Date.now() - response.notification.date < LAUNCH_FRESH_MS) {
        timer = setTimeout(() => router.push(route), LAUNCH_DELAY_MS);
      }
    });
    return () => clearTimeout(timer);
  }, [ready, router]);
}

/** An on/off setting kept on the phone and shared by every screen that shows it. */
export function createToggle(key: string) {
  let value = false;
  const subscribers = new Set<() => void>();

  const set = async (next: boolean) => {
    value = next;
    subscribers.forEach((notify) => notify());
    if (next) await SecureStore.setItemAsync(key, '1').catch(() => {});
    else await SecureStore.deleteItemAsync(key).catch(() => {});
  };

  const load = async (): Promise<boolean> => {
    try {
      value = (await SecureStore.getItemAsync(key)) === '1';
    } catch {
      value = false;
    }
    subscribers.forEach((notify) => notify());
    return value;
  };

  const subscribe = (notify: () => void) => {
    subscribers.add(notify);
    return () => {
      subscribers.delete(notify);
    };
  };

  if (supported) void load();

  return { get: () => value, set, load, subscribe };
}
