// The paired band: pair, unpair, and sync daily steps and sleep. Field names match the backend
// band.typeDefs.ts. This phone pairs itself as a band (lib/band.ts) to send what it measures.
import { gql } from '@apollo/client';

export const BAND_FIELDS = gql`
  fragment BandFields on Band {
    id
    bandId
    model
    firmware
    pairedAt
    lastSyncedAt
  }
`;

export const MY_BAND = gql`
  ${BAND_FIELDS}
  query MyBand {
    myBand {
      ...BandFields
    }
  }
`;

export const PAIR_BAND = gql`
  ${BAND_FIELDS}
  mutation PairBand($input: PairBandInput!) {
    pairBand(input: $input) {
      ...BandFields
    }
  }
`;

export const UNPAIR_BAND = gql`
  mutation UnpairBand {
    unpairBand
  }
`;

export const SYNC_BAND = gql`
  ${BAND_FIELDS}
  mutation SyncBand($input: SyncBandInput!) {
    syncBand(input: $input) {
      syncedDays
      skippedDays
      band {
        ...BandFields
      }
    }
  }
`;

export type Band = {
  __typename?: 'Band';
  id: string;
  /** Uppercased by the server. */
  bandId: string;
  model: string;
  firmware: string;
  pairedAt: string;
  /** null until the first sync. */
  lastSyncedAt: string | null;
};

/** One day of totals. A missing value leaves the stored one unchanged. */
/** Where a value came from. The server keeps the value from the most trusted source: steps
 *  BAND > PHONE; sleep MANUAL > BAND > PHONE > ESTIMATE (a guess from the sleep schedule). */
export type DataSource = 'BAND' | 'PHONE' | 'MANUAL' | 'ESTIMATE';

export type BandDay = {
  day: string;
  steps?: number;
  stepsSource?: 'BAND' | 'PHONE';
  sleepHours?: number;
  sleepSource?: DataSource;
};

export type BandSyncResult = { syncedDays: number; skippedDays: number; band: Band };

/** Matches the backend limits. */
export const BAND_LIMITS = { syncDays: 62, backdateDays: 30 } as const;
