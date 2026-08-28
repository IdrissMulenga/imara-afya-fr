// hooks/use-med-reminders.ts — reminders for the medicines you actually take.
//
// The point of setting times on a medicine is to be reminded at them, so this
// keeps the scheduled notifications in step with the medication list: add,
// edit, pause or delete a medicine and the reminders follow automatically.
//
// Kept separate from the water and wellbeing nudges on purpose. Those are
// encouragement; this is someone's heart medication. Sharing one switch would
// mean turning off a health reminder to escape a hydration nudge.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';

import { useStrings } from '@/constants/strings';
import {
  cancelMedicationReminders,
  medicationRemindersScheduled,
  scheduleMedicationReminders,
} from '@/lib/notifications';
import useMedications from '@/hooks/use-medications';

export function useMedReminders() {
  const { t, lang } = useStrings();

  const { medications } = useMedications();

  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);

  const titleFor = useCallback(
    (name: string) => `${t.medReminderTitle} ${name}`,
    [t],
  );

  const bodyFor = useCallback(
    (dosage: string | null | undefined, time: string) =>
      // dosage is optional, so don't leave a dangling separator when it's absent
      [dosage, time].filter(Boolean).join(' · '),
    [],
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      const [scheduled, permission] = await Promise.all([
        medicationRemindersScheduled(),
        Notifications.getPermissionsAsync().catch(() => ({ granted: false, canAskAgain: false })),
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

  // KEEP THE SCHEDULE IN STEP WITH THE MEDICINES.
  //
  // Reminders are baked in when scheduled — the medicine's name and time are
  // copied into the notification. So changing a dose time, renaming a medicine,
  // pausing one, or switching language all need a reschedule, or people keep
  // getting reminders for a medicine they stopped taking a month ago.
  //
  // The signature is what actually matters, not the array identity: a refetch
  // hands back new objects every time, and rescheduling on that would rewrite
  // every notification several times a minute.
  const signature = medications
    .filter((m) => m.active)
    .map((m) => `${m.id}:${m.name}:${m.dosage ?? ''}:${(m.times ?? []).join(',')}`)
    .sort()
    .join('|');

  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !enabled) return;
    if (lastSignature.current === `${lang}::${signature}`) return;

    lastSignature.current = `${lang}::${signature}`;

    scheduleMedicationReminders(medications, titleFor, bodyFor, t.notifChannelName).catch(() => {});
  }, [ready, enabled, signature, lang, medications, titleFor, bodyFor]);

  const toggle = async (next: boolean) => {
    setBusy(true);

    try {
      if (!next) {
        await cancelMedicationReminders();
        setEnabled(false);
        lastSignature.current = null;

        return true;
      }

      const done = await scheduleMedicationReminders(medications, titleFor, bodyFor, t.notifChannelName);

      setEnabled(done);

      if (done) lastSignature.current = `${lang}::${signature}`;
      else {
        const permission = await Notifications.getPermissionsAsync().catch(
          () => ({ granted: false, canAskAgain: false }),
        );

        setBlocked(!permission.granted && !permission.canAskAgain);
      }

      return done;
    } finally {
      setBusy(false);
    }
  };

  // how many reminders this would actually create — worth showing, because
  // "on" with zero scheduled medicines looks broken otherwise
  const reminderCount = medications
    .filter((m) => m.active)
    .reduce((total, m) => total + (m.times?.length ?? 0), 0);

  return { enabled, toggle, busy, blocked, ready, reminderCount };
}

export default useMedReminders;
