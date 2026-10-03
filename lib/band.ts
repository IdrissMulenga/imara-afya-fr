// Sends the steps and sleep this phone measures through syncBand, the backend's only way in for
// them. The band belongs to the account, not the phone: every phone signed in to the account
// syncs through the band paired with it, and pairs one for the account when there is none.
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { client } from './apollo';
import { decodeToken, getToken } from './tokens';
import {
  BAND_LIMITS,
  MY_BAND,
  PAIR_BAND,
  SYNC_BAND,
  type Band,
  type BandDay,
  type BandSyncResult,
} from '@/graphql/band';

/** Model reported for a band paired by the app itself rather than from hardware. */
export const PHONE_MODEL = 'phone';

// The account's band id, by user, so a sync does not ask the server first every time.
const bandIds = new Map<string, string>();

const codeOf = (error: unknown): string | undefined =>
  CombinedGraphQLErrors.is(error)
    ? (error.errors[0]?.extensions as { code?: string } | undefined)?.code
    : undefined;

/** True when a band was paired by the app rather than from hardware. */
export const isPhoneBand = (band: Pick<Band, 'model'> | null | undefined): boolean =>
  band?.model === PHONE_MODEL;

// The band paired with the account, pairing ACCOUNT-<user> when there is none.
async function accountBandId(user: string): Promise<string> {
  const { data } = await client.query<{ myBand: Band | null }>({
    query: MY_BAND,
    fetchPolicy: 'network-only',
  });
  const paired = data?.myBand?.bandId;
  if (paired) return paired;

  const { data: created } = await client.mutate<{ pairBand: Band }>({
    mutation: PAIR_BAND,
    variables: { input: { bandId: `ACCOUNT-${user}`, model: PHONE_MODEL } },
  });
  return created?.pairBand.bandId ?? `ACCOUNT-${user}`.toUpperCase();
}

/** Saves daily steps and/or sleep to the account's band, pairing one first when needed. */
export async function syncDays(days: BandDay[]): Promise<BandSyncResult | null> {
  if (days.length === 0) return null;
  const user = decodeToken(await getToken())?.sub;
  if (!user) return null;

  const send = async (bandId: string): Promise<BandSyncResult | null> => {
    let last: BandSyncResult | null = null;
    for (let i = 0; i < days.length; i += BAND_LIMITS.syncDays) {
      const { data } = await client.mutate<{ syncBand: BandSyncResult }>({
        mutation: SYNC_BAND,
        variables: { input: { bandId, days: days.slice(i, i + BAND_LIMITS.syncDays) } },
      });
      last = data?.syncBand ?? last;
    }
    return last;
  };

  const known = bandIds.get(user);
  const bandId = known ?? (await accountBandId(user));
  bandIds.set(user, bandId);
  try {
    return await send(bandId);
  } catch (error) {
    // The account's band changed since we last asked: look it up again once.
    if (!known || codeOf(error) !== 'BAND_NOT_PAIRED') throw error;
    const fresh = await accountBandId(user);
    bandIds.set(user, fresh);
    return send(fresh);
  }
}
