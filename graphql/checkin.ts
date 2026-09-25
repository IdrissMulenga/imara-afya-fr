// Daily check-in: mood and energy 1–5 with a note. Field names match the backend checkin.typeDefs.ts.
import { gql } from '@apollo/client';

export const CHECK_IN_FIELDS = gql`
  fragment CheckInFields on CheckIn {
    day
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
      ...CheckInFields
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
  mutation DeleteCheckIn($day: String) {
    deleteCheckIn(day: $day)
  }
`;

/** day is YYYY-MM-DD in the user's timezone. mood and energy are 1–5. */
export type CheckIn = {
  __typename?: 'CheckIn';
  day: string;
  mood: number;
  energy: number;
  note: string;
};

/** mood and energy are null when count is 0. */
export type CheckInAverages = {
  days: number;
  count: number;
  mood: number | null;
  energy: number | null;
};

export type CheckInSummary = {
  today: CheckIn | null;
  streak: number;
  week: CheckInAverages;
  month: CheckInAverages;
};

/** Matches the backend limits. */
export const CHECK_IN_LIMITS = { note: 500 } as const;
