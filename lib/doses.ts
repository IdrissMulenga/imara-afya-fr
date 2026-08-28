// lib/doses.ts — turning medicines into the doses actually due today.
//
// THE BUG THIS EXISTS TO FIX.
//
// A dose used to be identified by medicine alone. So a medicine scheduled at
// 08:00 and 20:00 had ONE tick for the whole day: taking it at breakfast marked
// the evening dose done too, dropped the "due" count to zero, and filled the
// progress ring to 100%. The app told people they had finished their medication
// when they had half of it left to take.
//
// A dose is a medicine AND a time. That is what this builds.
import type { DueDose, DueDoseStatus, Medication, MedicationDose } from '@/graphql';

// HOW LATE IS LATE.
//
// A dose isn't missed the second the clock passes it — people are in a meeting,
// on a bus, asleep. An hour of grace, then it reads as late; past this it reads
// as missed, and the day's ring stops counting it as something still to do.
//
// Calling it "missed" too early is the failure that matters: an app that tells
// someone they missed a dose they are about to take teaches them to distrust it.
const LATE_AFTER_MINUTES = 60;
const MISSED_AFTER_MINUTES = 240;

/** Minutes past midnight, from a "HH:MM" slot. */
const minutesOf = (slot: string) => {
  const [h, m] = slot.split(':').map(Number);

  return h * 60 + m;
};

/**
 * WHERE THIS DOSE STANDS RIGHT NOW.
 *
 * `nowMinutes` is passed in rather than read from the clock so this is a pure
 * function — the same inputs always give the same answer, which is what makes
 * it testable and what stops two parts of the screen disagreeing because they
 * asked the clock a second apart.
 */
const statusOf = (slot: string | null, taken: boolean, nowMinutes: number): DueDoseStatus => {
  if (taken) return 'taken';

  // an as-needed medicine has no time it was supposed to happen, so it can
  // never be late for it
  if (!slot) return 'due';

  const late = nowMinutes - minutesOf(slot);

  if (late >= MISSED_AFTER_MINUTES) return 'missed';
  if (late >= LATE_AFTER_MINUTES) return 'late';
  if (late >= 0) return 'due';

  return 'upcoming';
};

// "08:00" sorts correctly as a string, so no parsing is needed to order a day
const byTime = (a: DueDose, b: DueDose) => (a.slot ?? '').localeCompare(b.slot ?? '');

/**
 * Expand active medicines into one entry per scheduled time, each marked with
 * whether that particular dose has been taken.
 *
 * A medicine with no times is "as needed" and produces a single entry with a
 * null slot — it still appears, but it is never counted as overdue, because
 * there is no time it was supposed to happen.
 */
export function buildDueDoses(
  medications: Medication[],
  logs: MedicationDose[],
  /** minutes past midnight on the user's clock; defaults to now */
  nowMinutes = new Date().getHours() * 60 + new Date().getMinutes(),
): DueDose[] {
  // "<medicationId>@<slot>" for scheduled doses. Unscheduled ones are counted
  // separately, since several in a day are legitimate.
  const takenSlots = new Set<string>();
  const takenAsNeeded = new Set<string>();

  for (const log of logs) {
    if (log.status !== 'taken') continue;

    if (log.slot) {
      takenSlots.add(`${log.medicationId}@${log.slot}`);
    } else {
      takenAsNeeded.add(log.medicationId);
    }
  }

  const doses: DueDose[] = [];

  for (const medication of medications) {
    if (!medication.active) continue;

    // NOT DUE TODAY, NOT ON THE LIST. An every-other-day tablet is not
    // outstanding on its off day, and a finished course is not outstanding at
    // all — showing either would put a permanent unticked row in front of
    // someone who has done nothing wrong. The server decides this, from the
    // medicine's frequency and course dates.
    if (medication.dueToday === false) continue;

    const times = medication.times ?? [];

    if (!times.length) {
      const taken = takenAsNeeded.has(medication.id);

      doses.push({
        key: medication.id,
        medicationId: medication.id,
        name: medication.name,
        dosage: medication.dosage,
        slot: null,
        taken,
        status: statusOf(null, taken, nowMinutes),
      });

      continue;
    }

    for (const slot of times) {
      const taken = takenSlots.has(`${medication.id}@${slot}`);

      doses.push({
        key: `${medication.id}@${slot}`,
        medicationId: medication.id,
        name: medication.name,
        dosage: medication.dosage,
        slot,
        taken,
        status: statusOf(slot, taken, nowMinutes),
      });
    }
  }

  // chronological, so the day reads top to bottom. As-needed medicines have no
  // time and sort to the front rather than being scattered through the list.
  return doses.sort(byTime);
}


/**
 * HOW MANY DOSES ARE STILL ACTUALLY OUTSTANDING.
 *
 * Missed ones are excluded. The count answers "what is left to do", and a dose
 * from six hours ago is not something you can still do today — leaving it in
 * meant the number never reached zero and the ring never filled, so a person
 * who took everything they could still saw a screen implying they hadn't.
 */
export const outstandingCount = (doses: DueDose[]) =>
  doses.filter((d) => d.status !== 'taken' && d.status !== 'missed').length;

/** Doses whose time has passed without being taken. */
export const missedCount = (doses: DueDose[]) => doses.filter((d) => d.status === 'missed').length;

/** How many have been taken — the numerator of the progress ring. */
export const takenCountOf = (doses: DueDose[]) => doses.filter((d) => d.taken).length;
