// hooks/use-notification-actions.ts — what happens when a reminder is answered.
//
// THE GAP THIS CLOSES.
//
// Every medicine reminder has carried `data: { kind, medicationId, slot }`
// since the day they were added, and nothing anywhere read it. Tapping a
// reminder opened the dashboard, and the user then hunted for the dose they had
// just been told about. The payload was written and thrown away.
//
// Now:
//   • "Taken"  records the dose from the lock screen. The app is never opened.
//   • "Snooze" puts it back in fifteen minutes.
//   • tapping the body opens the medicines screen.
//
// The first of those is the whole point. The gap where someone reads a banner,
// thinks "yes, I'll do that", takes the tablet and never records it is most of
// what separates a reminder from an adherence tool.
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { useStrings } from '@/constants/strings';
import {
  ACTION_SNOOZE, ACTION_TAKEN, SNOOZE_MINUTES, registerMedicationActions, snoozeDose,
} from '@/lib/notifications';
import useMedications from '@/hooks/use-medications';

type DosePayload = {
  kind?: string;
  medicationId?: string;
  slot?: string | null;
};

export function useNotificationActions() {
  const { t, lang } = useStrings();
  const { markTaken } = useMedications();

  // The listener is registered once and must not be torn down and rebuilt on
  // every render — a notification answered during the gap would be dropped.
  // These refs let the stable listener see current values.
  const strings = useRef({ t, lang });
  strings.current = { t, lang };

  const takeDose = useRef(markTaken);
  takeDose.current = markTaken;

  // the button titles are baked into the category when it is registered, so
  // this has to run again when the language changes
  useEffect(() => {
    registerMedicationActions(t.doseTakenAction, `${t.doseSnoozeAction} ${SNOOZE_MINUTES}m`).catch(() => {});
  }, [t]);

  useEffect(() => {
    const handle = async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as DosePayload;

      if (data?.kind !== 'medication' || !data.medicationId) return;

      const action = response.actionIdentifier;

      if (action === ACTION_TAKEN) {
        // Deliberately no toast. The app is in the background — there is
        // nothing to show it on, and the notification disappearing IS the
        // feedback. A failure is silent too, which is the honest trade: the
        // alternative is opening the app to complain, over a tablet that has
        // already been swallowed.
        await takeDose.current(data.medicationId, data.slot ?? null).catch(() => {});

        return;
      }

      if (action === ACTION_SNOOZE) {
        const { t: current } = strings.current;

        await snoozeDose(
          data.medicationId,
          data.slot ?? null,
          response.notification.request.content.title ?? current.medsTitle,
          response.notification.request.content.body ?? '',
        );

        return;
      }

      // the body was tapped rather than a button — open the list
      router.push('/(home)/medications');
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handle(response).catch(() => {});
    });

    // A notification answered while the app was CLOSED is not delivered to the
    // listener — it is waiting in `getLastNotificationResponseAsync` when the
    // app finally starts. Without this, "Taken" from a cold start does nothing.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) return handle(response);
      })
      .catch(() => {});

    return () => sub.remove();
  }, []);
}

export default useNotificationActions;
