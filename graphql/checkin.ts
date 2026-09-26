// Check-ins: mood and energy 1–5 with a note, several a day. Field names match the backend checkin.typeDefs.ts.
import { gql } from '@apollo/client';

export const CHECK_IN_FIELDS = gql`
  fragment CheckInFields on CheckIn {
    id
    day
    at
    mood
    energy
    note
  }
`;

export const CHECK_IN_SUMMARY = gql`
  ${CHECK_IN_FIELDS}
  query CheckInSummary {
    checkInSummary {
      today {
        ...CheckInFields
      }
      latest {
        ...CheckInFields
      }
      streak
      week {
        days
        count
        mood
        energy
      }
      month {
        days
        count
        mood
        energy
      }
    }
  }
`;

export const CHECK_IN_HISTORY = gql`
  ${CHECK_IN_FIELDS}
  query CheckInHistory($days: Int) {
    checkInHistory(days: $days) {
      day
      mood
      energy
      entries {
        ...CheckInFields
      }
    }
  }
`;

export const LOG_CHECK_IN = gql`
  ${CHECK_IN_FIELDS}
  mutation LogCheckIn($input: LogCheckInInput!) {
    logCheckIn(input: $input) {
      ...CheckInFields
    }
  }
`;

export const DELETE_CHECK_IN = gql`
  mutation DeleteCheckIn($id: ID!) {
    deleteCheckIn(id: $id)
  }
`;

/** One check-in. day is YYYY-MM-DD in the user's timezone; at is an ISO timestamp. */
export type CheckIn = {
  __typename?: 'CheckIn';
  id: string;
  day: string;
  at: string;
  mood: number;
  energy: number;
  note: string;
};

/** One day's check-ins, newest first, with that day's average mood and energy. */
export type CheckInDay = {
  day: string;
  mood: number;
  energy: number;
  entries: CheckIn[];
};

/** mood and energy are null when count is 0. */
export type CheckInAverages = {
  days: number;
  count: number;
  mood: number | null;
  energy: number | null;
};

export type CheckInSummary = {
  today: CheckIn[];
  latest: CheckIn | null;
  streak: number;
  week: CheckInAverages;
  month: CheckInAverages;
};

/** Matches the backend limits. */
export const CHECK_IN_LIMITS = { note: 500, perDay: 10 } as const;
