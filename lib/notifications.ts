// lib/notifications.ts — the daily nudges.
//
// Two reminders, both scheduled LOCALLY on the device:
//
//   • water — a few times through the day, "have a glass"
//   • wellbeing — one warm message, once a day
//
// Local rather than push, deliberately. A push notification needs a server, a
// delivery service and a working connection at the exact moment it fires. A
// local one is handed to the OS once and then fires on time forever, with the
// phone in flight mode, on 2G, or with our backend down. For a health reminder
// that is not a small difference.
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Show the banner even when the app is open. Someone staring at the dashboard
// should still be told to drink water.
//
// Wrapped because expo-notifications is only partially supported in Expo Go —
// setting the handler there can throw, and a throw at module load would take
// the whole app down rather than just disabling reminders.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // reminders won't work here; everything else still should
}

// Identifiers so we can cancel and reschedule ours without touching anything
// else the app might schedule later.
const WATER_PREFIX = 'water-';
const WELLBEING_ID = 'wellbeing-daily';

// MEDICATION REMINDERS are kept on their own prefix, and cancelled separately
// from the daily nudges. Someone may well want to be told about their heart
// medicine while having no interest in being nudged about water — and the two
// are not equally important, so they should not share a switch.
const MED_PREFIX = 'med-';

// channel ids and the action category, in one place so a typo can't split a
// notification from the channel it was meant to arrive on
const DAILY_CHANNEL = 'daily';
const MED_CHANNEL = 'medication';
export const MED_CATEGORY = 'medication-dose';
export const ACTION_TAKEN = 'taken';
export const ACTION_SNOOZE = 'snooze';

// long enough to finish what you were doing, short enough to still be today
export const SNOOZE_MINUTES = 15;

// WHEN TO NUDGE ABOUT WATER: every two hours, through waking hours only.
//
// Derived from a start, an end and a step rather than written out as a list,
// so changing the interval is one number instead of retyping the hours and
// hoping they're still evenly spaced.
//
// It stops at 21:00 on purpose. "Every two hours" taken literally would buzz
// at 01:00, 03:00 and 05:00 — nobody drinks water then, and a health app that
// wakes you up is one you turn the notifications off for, which costs you the
// medication reminders as well since people rarely turn just one thing back on.
const WATER_FROM_HOUR = 7;
const WATER_TO_HOUR = 21;
const WATER_EVERY_HOURS = 2;

const WATER_HOURS = Array.from(
  { length: Math.floor((WATER_TO_HOUR - WATER_FROM_HOUR) / WATER_EVERY_HOURS) + 1 },
  (_, i) => WATER_FROM_HOUR + i * WATER_EVERY_HOURS,
);

// One warm message a day, mid-morning. Late enough not to be the first thing
// on waking, early enough to still be a good day.
const WELLBEING_HOUR = 10;
const WELLBEING_MINUTE = 30;

export type NotificationCopy = {
  waterTitle: string;
  waterBody: string;
  wellbeingTitle: string;
  wellbeingBody: string;
  /** shown in Android's own notification settings, so it needs translating */
  channelName: string;
};

/** The shape a medicine needs to be reminded about. */
export type ReminderMedication = {
  id: string;
  name: string;
  dosage?: string | null;
  times: string[];
  active: boolean;
};

/**
 * Ask for permission, if we don't already have it.
 *
 * Returns false rather than throwing — being declined is a normal answer, and
 * the app has to keep working for someone who says no.
 */
export async function requestNotificationPermission() {
  try {
    // an emulator can't deliver these, and asking there just fails confusingly
    if (!Device.isDevice) return false;

    const existing = await Notifications.getPermissionsAsync();

    if (existing.granted) return true;

    // Never re-ask if they've explicitly said no and the OS won't show the
    // dialog again — that just returns denied without any prompt.
    if (!existing.canAskAgain) return false;

    const asked = await Notifications.requestPermissionsAsync();

    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Android needs an explicit channel or notifications arrive silently with no
 * way for the user to control them in system settings.
 *
 * THE CHANNEL NAME IS TRANSLATED TOO. It was the last hardcoded English string
 * in the notification path — and it is the one the user sees in Android's own
 * Settings screen, next to the switch that turns these off. Every other piece
 * of text here already comes from the caller's dictionary.
 *
 * Re-setting an existing channel id updates its name in place, so calling this
 * after a language change is what actually retranslates it. Android will not
 * let an app change a channel's importance or sound afterwards — only cosmetic
 * fields like the name — which is exactly what we need and no more.
 */
async function ensureAndroidChannel(name: string) {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(DAILY_CHANNEL, {
    name,
    importance: Notifications.AndroidImportance.DEFAULT,
    // gentle: this is a nudge, not an alarm
    vibrationPattern: [0, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}


/**
 * MEDICINES GET THEIR OWN CHANNEL, at HIGH importance.
 *
 * Two reasons, and the second is the important one.
 *
 * HIGH pops a heads-up banner and makes a sound; DEFAULT is allowed to arrive
 * silently in the shade. "Take your heart tablet" is not a nudge about water.
 *
 * And a SEPARATE channel means the user can silence the hydration reminders
 * without silencing their medication. On one shared channel that is a single
 * switch, and the person who mutes it because water was annoying has also just
 * muted the reminder that actually mattered.
 *
 * Android will not let an app lower a channel's importance after it is created
 * — deliberately, so apps can't quietly turn themselves up. Only the user can,
 * in system settings, which is exactly the right owner for that decision.
 */
async function ensureMedicationChannel(name: string) {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(MED_CHANNEL, {
    name,
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}


/**
 * THE BUTTONS ON A MEDICINE REMINDER.
 *
 * "Taken" records the dose without opening the app at all — from the lock
 * screen, one tap, done. That is the whole difference between a reminder and
 * something that actually improves adherence: the gap where someone sees the
 * banner, thinks "yes I'll do that", and never records it.
 *
 * "Snooze" exists because the honest answer is often "not this second". Without
 * it people dismiss the notification, and a dismissed reminder is gone.
 *
 * `opensAppToForeground: false` is what keeps both silent. The response still
 * reaches the listener in lib/notification-actions.ts while the app is
 * backgrounded.
 */
export async function registerMedicationActions(taken: string, snooze: string) {
  try {
    await Notifications.setNotificationCategoryAsync(MED_CATEGORY, [
      {
        identifier: ACTION_TAKEN,
        buttonTitle: taken,
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_SNOOZE,
        buttonTitle: snooze,
        options: { opensAppToForeground: false },
      },
    ]);
  } catch {
    // categories are a nicety; the notification still arrives without them
  }
}


/** Put a dose back on the shelf for a few minutes. One-shot, not repeating. */
export async function snoozeDose(
  medicationId: string,
  slot: string | null,
  title: string,
  body: string,
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { kind: 'medication', medicationId, slot },
        categoryIdentifier: MED_CATEGORY,
        ...(Platform.OS === 'android' ? { channelId: MED_CHANNEL } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SNOOZE_MINUTES * 60,
        repeats: false,
      },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Schedule (or re-schedule) both daily reminders.
 *
 * Cancels ours first so calling this repeatedly — on every launch, or after a
 * language change — never stacks up duplicates. That is the classic bug with
 * local notifications: the user ends up with six identical banners because
 * something rescheduled without cancelling.
 */
export async function scheduleDailyReminders(copy: NotificationCopy) {
  try {
    const allowed = await requestNotificationPermission();

    if (!allowed) return false;

    await ensureAndroidChannel(copy.channelName);
    await cancelDailyReminders();

    for (const hour of WATER_HOURS) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${WATER_PREFIX}${hour}`,
        content: {
          title: copy.waterTitle,
          body: copy.waterBody,
          ...(Platform.OS === 'android' ? { channelId: 'daily' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });
    }

    await Notifications.scheduleNotificationAsync({
      identifier: WELLBEING_ID,
      content: {
        title: copy.wellbeingTitle,
        body: copy.wellbeingBody,
        ...(Platform.OS === 'android' ? { channelId: DAILY_CHANNEL } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: WELLBEING_HOUR,
        minute: WELLBEING_MINUTE,
      },
    });

    return true;
  } catch (error) {
    // Expo Go supports notifications only partially, so scheduling can fail
    // outright there. Report it as "didn't turn on" rather than crashing — the
    // toggle then explains itself instead of taking the screen with it.
    console.warn('[notifications] could not schedule reminders:', error);

    return false;
  }
}

/* ------------------------ medication reminders ------------------------ */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Schedule one daily reminder per medicine, per scheduled time.
 *
 * A medicine at 08:00 and 20:00 gets TWO reminders, matching the two doses the
 * app tracks. Anything paused, or with no times set, is skipped — an as-needed
 * painkiller has no time to remind anyone about.
 *
 * The medicine is NAMED in the notification. "Time for your medicine" is
 * useless to someone taking four different things; "Metformin — 500mg" tells
 * them what to pick up without unlocking the phone.
 *
 * @param medications the user's medicines
 * @param titleFor    builds the title, e.g. name => `Time for ${name}`
 * @param bodyFor     builds the body, e.g. (dosage, time) => `${dosage} · ${time}`
 */
export async function scheduleMedicationReminders(
  medications: ReminderMedication[],
  titleFor: (name: string) => string,
  bodyFor: (dosage: string | null | undefined, time: string) => string,
  channelName: string,
) {
  try {
    const allowed = await requestNotificationPermission();

    if (!allowed) return false;

    await ensureMedicationChannel(channelName);
    // always clear ours first: this runs whenever a medicine is added, edited,
    // paused or deleted, and without the cancel those changes would stack
    // reminders rather than replace them
    await cancelMedicationReminders();

    for (const medication of medications) {
      if (!medication.active) continue;

      for (const time of medication.times ?? []) {
        // a malformed time would throw inside the scheduler and abort the whole
        // loop, silently losing every reminder after it
        if (!TIME_RE.test(time)) continue;

        const [hour, minute] = time.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
          identifier: `${MED_PREFIX}${medication.id}-${time}`,
          content: {
            title: titleFor(medication.name),
            body: bodyFor(medication.dosage, time),
            // so tapping the reminder can open the right screen later
            data: { kind: 'medication', medicationId: medication.id, slot: time },
            // THE MOST IMPORTANT LINE IN THIS FILE.
            //
            // iOS 15+ lets people batch notifications into a Scheduled Summary
            // delivered twice a day, and Focus modes silence everything else.
            // A medicine reminder in a digest is worthless — "take your 08:00
            // dose" arriving at 18:00. Time-sensitive is exempt from Summary
            // and breaks through Focus, which is exactly what this is for.
            //
            // It needs the time-sensitive entitlement in app.json; without it
            // iOS ignores the level rather than rejecting the notification, so
            // this degrades to today's behaviour rather than breaking.
            interruptionLevel: 'timeSensitive',
            categoryIdentifier: MED_CATEGORY,
            ...(Platform.OS === 'android' ? { channelId: MED_CHANNEL } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
      }
    }

    return true;
  } catch (error) {
    console.warn('[notifications] could not schedule medication reminders:', error);

    return false;
  }
}

/** Remove medication reminders only, leaving the water and wellbeing ones. */
export async function cancelMedicationReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const item of scheduled) {
      if (item.identifier.startsWith(MED_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch {
    // nothing scheduled if the module can't answer, so nothing to remove
  }
}

/** Are any medication reminders currently scheduled? */
export async function medicationRemindersScheduled() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    return scheduled.some((item) => item.identifier.startsWith(MED_PREFIX));
  } catch {
    return false;
  }
}


/** Remove only the reminders this file scheduled. */
export async function cancelDailyReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const item of scheduled) {
      const id = item.identifier;

      if (id === WELLBEING_ID || id.startsWith(WATER_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
  } catch {
    // nothing was scheduled if the module can't answer, so nothing to remove
  }
}

/** Are our reminders currently scheduled? Used to drive the settings toggle. */
export async function remindersScheduled() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    return scheduled.some(
      (item) => item.identifier === WELLBEING_ID || item.identifier.startsWith(WATER_PREFIX),
    );
  } catch {
    return false;
  }
}
