// Entries made without a connection (water, check-ins, weight, vital readings), kept on the phone
// and sent in order once the server can be reached. Each is safe to send twice: water is sent as
// the day's total, weight replaces the day's weight, and check-ins and readings carry a client id
// the server recognises. Entries belong to the user who made them: only theirs are counted and
// sent, so they survive an expired session, and they are cleared when that user signs out.
import { useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { client } from './apollo';
import { decodeToken, getToken } from './tokens';
import { LOG_HABITS } from '@/graphql/habits';
import { LOG_CHECK_IN } from '@/graphql/checkin';
import { LOG_WEIGHT } from '@/graphql/weight';
import { LOG_VITAL, type GlucoseContext, type VitalKind } from '@/graphql/vitals';

const KEY = 'imara.offlineQueue';
// Most entries kept; past this the oldest are dropped.
const MAX_ITEMS = 100;
// Queries that show entries, refreshed after any are sent.
const REFRESH = [
  'HabitSummary',
  'HabitHistory',
  'CheckInSummary',
  'CheckInHistory',
  'WeightHistory',
  'WeightSummary',
  'VitalSummary',
  'Vitals',
  'Insights',
  'Achievements',
];

export type CheckInEntry = { mood: number; energy: number; note: string; at: string; clientId: string };
export type VitalEntry = {
  kind: VitalKind;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  glucoseMmol?: number;
  glucoseContext?: GlucoseContext;
  at: string;
  clientId: string;
};

type Op =
  | { kind: 'water'; day: string; waterGlasses: number }
  | { kind: 'checkIn'; input: CheckInEntry }
  | { kind: 'weight'; day: string; kg: number }
  | { kind: 'vital'; input: VitalEntry };

type Item = { id: string; user: string; op: Op };

let items: Item[] = [];
// The signed-in user, whose entries are counted.
let queueUser: string | null = null;
let loaded: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

async function load(): Promise<void> {
  loaded ??= (async () => {
    try {
      items = JSON.parse((await SecureStore.getItemAsync(KEY)) ?? '[]') as Item[];
    } catch {
      items = [];
    }
    notify();
  })();
  return loaded;
}

async function save(): Promise<void> {
  notify();
  try {
    if (items.length) await SecureStore.setItemAsync(KEY, JSON.stringify(items));
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore: the entries stay in memory until the app closes
  }
}

const currentUser = async (): Promise<string | null> => decodeToken(await getToken())?.sub ?? null;

/** Sets whose entries are counted (the signed-in user, or null when signed out). */
export function setQueueUser(user: string | null): void {
  queueUser = user;
  notify();
}

const mine = () => items.filter((item) => item.user === queueUser);

/** A new id for an entry, so a resent one is recognised. */
export const newClientId = (): string => Crypto.randomUUID();

// Answers that are about the request, not the entry: the entry is kept and sent later.
const RETRY_CODES = new Set(['UNAUTHENTICATED', 'SESSION_EXPIRED', 'TOKEN_REVOKED', 'RATE_LIMITED', 'INTERNAL']);

/** True when an error means the server could not be reached (no connection, a timeout, a
 *  server or gateway failure), so the entry should be kept and sent later. False when the server
 *  answered. */
export function isOfflineError(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) return false;
  if (ServerError.is(error)) return error.statusCode >= 500 || error.statusCode === 408;
  return true;
}

/** True when the entry should stay waiting: the server could not be reached, or it answered
 *  about the session, its limits or its own failure rather than about the entry. False only
 *  when it refused the entry itself (e.g. a day's limit), which sending again would not change. */
export function shouldRetry(error: unknown): boolean {
  if (isOfflineError(error)) return true;
  if (ServerError.is(error)) return error.statusCode === 429 || error.statusCode === 401;
  if (!CombinedGraphQLErrors.is(error)) return true;
  return error.errors.some((e) => RETRY_CODES.has(String((e.extensions as { code?: string } | undefined)?.code)));
}

// The same water day or weight day replaces the one already waiting; other entries are added.
const sameSlot = (a: Op, b: Op): boolean =>
  (a.kind === 'water' && b.kind === 'water' && a.day === b.day) ||
  (a.kind === 'weight' && b.kind === 'weight' && a.day === b.day);

/** Keeps an entry to send later. */
export async function enqueue(op: Op): Promise<void> {
  await load();
  const user = await currentUser();
  if (!user) return;
  items = [...items.filter((item) => !(item.user === user && sameSlot(item.op, op))), { id: newClientId(), user, op }].slice(
    -MAX_ITEMS
  );
  await save();
}

/** The day's water total waiting to be sent, or null. */
export function queuedWater(day: string): number | null {
  const item = mine().find((i) => i.op.kind === 'water' && i.op.day === day);
  return item && item.op.kind === 'water' ? item.op.waterGlasses : null;
}

/** Adds glasses to a water total still waiting for `day`, after they were added online: the
 *  waiting total is sent as the day's total, so it must include them. */
export async function addToQueuedWater(day: string, glasses: number): Promise<void> {
  await load();
  const user = await currentUser();
  let changed = false;
  items = items.map((item) => {
    if (item.user !== user || item.op.kind !== 'water' || item.op.day !== day) return item;
    changed = true;
    return { ...item, op: { ...item.op, waterGlasses: Math.max(0, item.op.waterGlasses + glasses) } };
  });
  if (changed) await save();
}

/** Forgets a weight waiting for `day`, once a newer one has been saved online. */
export async function dropQueuedWeight(day: string): Promise<void> {
  await load();
  const before = items.length;
  items = items.filter((i) => !(i.op.kind === 'weight' && i.op.day === day));
  if (items.length !== before) await save();
}

/** Forgets the signed-in user's waiting entries (when they sign out). */
export async function clearQueue(): Promise<void> {
  await load();
  const user = await currentUser();
  if (!user) return;
  items = items.filter((item) => item.user !== user);
  await save();
}

async function send(op: Op): Promise<void> {
  if (op.kind === 'water') {
    await client.mutate({ mutation: LOG_HABITS, variables: { input: { day: op.day, waterGlasses: op.waterGlasses } } });
  } else if (op.kind === 'checkIn') {
    await client.mutate({ mutation: LOG_CHECK_IN, variables: { input: op.input } });
  } else if (op.kind === 'weight') {
    await client.mutate({ mutation: LOG_WEIGHT, variables: { input: { day: op.day, kg: op.kg } } });
  } else {
    await client.mutate({ mutation: LOG_VITAL, variables: { input: op.input } });
  }
}

let flushing: Promise<{ sent: number; dropped: number }> | null = null;

/** Sends the signed-in user's waiting entries in order. Stops at the first one the server cannot
 *  be reached for; drops one the server refuses (e.g. a day's check-in limit). */
export function flushQueue(): Promise<{ sent: number; dropped: number }> {
  flushing ??= (async () => {
    let sent = 0;
    let dropped = 0;
    try {
      await load();
      const user = await currentUser();
      if (!user) return { sent, dropped };
      for (const item of items.filter((i) => i.user === user)) {
        try {
          await send(item.op);
          sent += 1;
        } catch (error) {
          if (shouldRetry(error)) break;
          dropped += 1;
        }
        items = items.filter((i) => i.id !== item.id);
        await save();
      }
      if (sent > 0) await client.refetchQueries({ include: REFRESH }).catch(() => {});
      return { sent, dropped };
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/** How many entries are waiting to be sent. */
export function useQueuedCount(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      void load();
      return () => {
        listeners.delete(listener);
      };
    },
    () => mine().length
  );
}
