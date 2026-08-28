// hooks/use-reminders.ts — the daily reminders toggle.
//
// Owns three things the settings row needs: whether reminders are currently
// scheduled, whether the phone will even allow them, and turning them on or off.
//
// The preference lives on the device rather than the account, because that is
// where the notifications live. Signing in on a second phone should not silently
// start buzzing the first one.
import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';

import { useStrings } from '@/constants/strings';
import {
  cancelDailyReminders, remindersScheduled, scheduleDailyReminders,
} from '@/lib/notifications';

export function useReminders() {
  const { t, lang } = useStrings();

  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  // permission refused at OS level — the toggle should say so rather than
  // silently failing every time it's tapped
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);

  const copy = useCallback(() => ({
    waterTitle: t.notifWaterTitle,
    waterBody: t.notifWaterBody,
    wellbeingTitle: t.notifCareTitle,
    wellbeingBody: t.notifCareBody,
    channelName: t.notifChannelName,
  }), [t]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const [scheduled, permission] = await Promise.all([
        remindersScheduled(),
        Notifications.getPermissionsAsync(),
      ]);

      if (!alive) return;

      setEnabled(scheduled);
      setBlocked(!permission.granted && !permission.canAskAgain);
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // RESCHEDULE WHEN THE LANGUAGE CHANGES.
  //
  // The text is baked into each notification when it is scheduled, so a
  // reminder queued in English still arrives in English months later. Someone
  // who switches to Kirundi would keep getting English nudges forever.
  useEffect(() => {
    if (!ready || !enabled) return;

    scheduleDailyReminders(copy()).catch(() => {});
  }, [lang, ready, enabled, copy]);

  const toggle = async (next: boolean) => {
    setBusy(true);

    try {
      if (!next) {
        await cancelDailyReminders();
        setEnabled(false);

        return true;
      }

      const done = await scheduleDailyReminders(copy());

      setEnabled(done);

      // asked and refused — remember so the UI can explain instead of retrying
      if (!done) {
        const permission = await Notifications.getPermissionsAsync();

        setBlocked(!permission.granted && !permission.canAskAgain);
      }

      return done;
    } finally {
      setBusy(false);
    }
  };

  return { enabled, toggle, busy, blocked, ready };
}

export default useReminders;
