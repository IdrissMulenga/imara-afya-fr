// Automatic tracking for the whole app: step permission and live steps, sleep
// tracking state, periodic syncs while the app is open, and cleanup on sign-out.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useSession } from './session';
import {
  addLiveSteps,
  clearSteps,
  getLocalSteps,
  getStepPermission,
  localDay,
  onStepsChanged,
  requestStepPermission,
  stepMode,
  syncSteps,
  type StepMode,
  type StepPermission,
} from './steps';
import { registerStepsTask, unregisterStepsTask } from './steps-task';
import { clearSleep, enableSleep, isSleepEnabled, setSleepSchedule, sleepSupported } from './sleep';
import { schedulesFrom } from './sleep-schedule';
import { syncHealth } from './sync';

// How often to sync while the app is open.
const FOREGROUND_SYNC_MS = 60_000;

type StepsValue = {
  mode: StepMode;
  permission: StepPermission;
  /** True when steps are being counted automatically. */
  active: boolean;
  /** Today's local calendar day, YYYY-MM-DD. */
  today: string;
  /** Today's steps counted on this phone, including live steps since the last sync. */
  localToday: number;
  /** Asks for the motion permission and starts counting if granted. */
  enable: () => Promise<void>;
  /** True when this phone can track sleep automatically. */
  sleepSupported: boolean;
  sleepEnabled: boolean;
  /** Asks for the permission and starts sleep tracking. Resolves whether it started. */
  enableSleep: () => Promise<boolean>;
};

const StepsContext = createContext<StepsValue>({
  mode: 'none',
  permission: 'undetermined',
  active: false,
  today: localDay(),
  localToday: 0,
  enable: async () => {},
  sleepSupported: false,
  sleepEnabled: false,
  enableSleep: async () => false,
});

/** Provides step counting and sleep tracking state to the app. */
export function StepsProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const userId = user?.id;
  const mode = useMemo(stepMode, []);
  const [permission, setPermission] = useState<StepPermission>('undetermined');
  const [, setVersion] = useState(0);
  const [live, setLive] = useState(0);
  const canTrackSleep = useMemo(sleepSupported, []);
  const [sleepEnabled, setSleepEnabled] = useState(false);
  const watchCount = useRef(0);
  const watchBase = useRef(0);

  // Permission on sign-in; local data and the background task are dropped on sign-out.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      void clearSteps();
      void clearSleep();
      void unregisterStepsTask();
      setSleepEnabled(false);
      return;
    }
    void getStepPermission().then(setPermission);
    void isSleepEnabled().then(setSleepEnabled);
  }, [ready, userId]);

  // The sleep schedule from the profile, kept where background syncs can read it.
  const schedules = user ? schedulesFrom(user) : null;
  const scheduleKey = JSON.stringify(schedules);
  const hasSchedule = Boolean(schedules);
  useEffect(() => {
    if (!ready || !userId) return;
    void setSleepSchedule(JSON.parse(scheduleKey));
  }, [ready, userId, scheduleKey]);

  const active = Boolean(userId) && permission === 'granted' && mode !== 'none';
  const syncing = active || (Boolean(userId) && (sleepEnabled || hasSchedule));

  // A sync resets the live count: its reading already includes those steps.
  useEffect(
    () =>
      onStepsChanged(() => {
        watchBase.current = watchCount.current;
        setLive(0);
        setVersion((v) => v + 1);
      }),
    [],
  );

  useEffect(() => {
    if (!syncing) return;
    void registerStepsTask();
    void syncHealth();

    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void syncSteps();
    }, FOREGROUND_SYNC_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' || next === 'background') void syncHealth();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [syncing]);

  // Live steps while the app is open.
  useEffect(() => {
    if (!active) return;
    watchCount.current = 0;
    watchBase.current = 0;
    const sub = Pedometer.watchStepCount(({ steps }) => {
      if (mode === 'live') {
        const delta = steps - watchCount.current;
        watchCount.current = steps;
        void addLiveSteps(delta);
        return;
      }
      watchCount.current = steps;
      setLive(Math.max(0, steps - watchBase.current));
    });
    return () => sub.remove();
  }, [active, mode]);

  const enable = useCallback(async () => {
    setPermission(await requestStepPermission());
  }, []);

  const startSleep = useCallback(async () => {
    const started = await enableSleep();
    setSleepEnabled(started);
    return started;
  }, []);

  // On Android, sleep uses the same physical-activity permission as steps, so it starts
  // as soon as that is granted.
  useEffect(() => {
    if (Platform.OS !== 'android' || !userId || !canTrackSleep || permission !== 'granted' || sleepEnabled) return;
    void startSleep();
  }, [userId, canTrackSleep, permission, sleepEnabled, startSleep]);

  const today = localDay();
  const value: StepsValue = {
    mode,
    permission,
    active,
    today,
    localToday: getLocalSteps(today) + live,
    enable,
    sleepSupported: canTrackSleep,
    sleepEnabled,
    enableSleep: startSleep,
  };

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
}

export const useSteps = () => useContext(StepsContext);

/** Today's steps to show: the higher of the server's value and this phone's count. */
export function useTodaySteps(server?: { day: string; steps: number } | null): number {
  const { today, localToday } = useSteps();
  const fromServer = server && server.day === today ? server.steps : 0;
  return Math.max(fromServer, localToday);
}
