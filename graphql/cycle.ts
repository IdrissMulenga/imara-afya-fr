// Menstrual cycle: periods, day logs and the estimates they give. Field names match the backend cycle.typeDefs.ts.
import { gql } from '@apollo/client';

export const CYCLE_PERIOD_FIELDS = gql`
  fragment CyclePeriodFields on CyclePeriod {
    id
    start
    end
    lengthDays
    cycleLength
  }
`;

export const CYCLE_DAY_FIELDS = gql`
  fragment CycleDayFields on CycleDay {
    day
    flow
    symptoms
    discharge
    note
  }
`;

export const CYCLE_SUMMARY = gql`
  ${CYCLE_PERIOD_FIELDS}
  ${CYCLE_DAY_FIELDS}
  query CycleSummary {
    cycleSummary {
      periods {
        ...CyclePeriodFields
      }
      current {
        ...CyclePeriodFields
      }
      currentEnd
      autoEnded
      averageCycleLength
      averagePeriodLength
      cycleVariation
      cyclesUsed
      cycleDay
      phase
      nextPeriodStart
      nextPeriodInDays
      ovulationDay
      fertileStart
      fertileEnd
      predictions {
        start
        end
        earliest
        latest
        ovulationDay
        fertileStart
        fertileEnd
      }
      notes
      patterns {
        symptom
        phase
        count
        share
      }
      today {
        ...CycleDayFields
      }
    }
  }
`;

export const CYCLE_DAYS = gql`
  ${CYCLE_DAY_FIELDS}
  query CycleDays($from: String!, $to: String!) {
    cycleDays(from: $from, to: $to) {
      ...CycleDayFields
    }
  }
`;

export const START_PERIOD = gql`
  ${CYCLE_PERIOD_FIELDS}
  mutation StartPeriod($day: String) {
    startPeriod(day: $day) {
      ...CyclePeriodFields
    }
  }
`;

export const END_PERIOD = gql`
  ${CYCLE_PERIOD_FIELDS}
  mutation EndPeriod($day: String) {
    endPeriod(day: $day) {
      ...CyclePeriodFields
    }
  }
`;

export const DELETE_PERIOD = gql`
  mutation DeletePeriod($id: ID!) {
    deletePeriod(id: $id)
  }
`;

export const LOG_CYCLE_DAY = gql`
  ${CYCLE_DAY_FIELDS}
  mutation LogCycleDay($input: CycleDayInput!) {
    logCycleDay(input: $input) {
      ...CycleDayFields
    }
  }
`;

export type CycleFlow = 'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY';
export type CycleSymptom =
  | 'CRAMPS'
  | 'HEADACHE'
  | 'BACK_PAIN'
  | 'BLOATING'
  | 'TENDER_BREASTS'
  | 'ACNE'
  | 'FATIGUE'
  | 'NAUSEA'
  | 'CRAVINGS'
  | 'INSOMNIA'
  | 'MOOD_SWINGS'
  | 'ANXIETY';
export type CycleDischarge = 'DRY' | 'STICKY' | 'CREAMY' | 'WATERY' | 'EGG_WHITE' | 'UNUSUAL';
export type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'LUTEAL' | 'UNKNOWN';
export type CycleNote = 'IRREGULAR' | 'SHORT_CYCLES' | 'LONG_CYCLES' | 'LONG_PERIODS' | 'VERY_LATE';

export const FLOWS: CycleFlow[] = ['NONE', 'SPOTTING', 'LIGHT', 'MEDIUM', 'HEAVY'];
export const SYMPTOMS: CycleSymptom[] = [
  'CRAMPS',
  'HEADACHE',
  'BACK_PAIN',
  'BLOATING',
  'TENDER_BREASTS',
  'ACNE',
  'FATIGUE',
  'NAUSEA',
  'CRAVINGS',
  'INSOMNIA',
  'MOOD_SWINGS',
  'ANXIETY',
];
export const DISCHARGES: CycleDischarge[] = ['DRY', 'STICKY', 'CREAMY', 'WATERY', 'EGG_WHITE', 'UNUSUAL'];

/** Dates are YYYY-MM-DD in the user's timezone; end is null while the period is open. */
export type CyclePeriod = {
  __typename?: 'CyclePeriod';
  id: string;
  start: string;
  end: string | null;
  lengthDays: number | null;
  cycleLength: number | null;
};

export type CycleDay = {
  __typename?: 'CycleDay';
  day: string;
  flow: CycleFlow;
  symptoms: CycleSymptom[];
  discharge: CycleDischarge | null;
  note: string;
};

export type CyclePrediction = {
  start: string;
  end: string;
  earliest: string;
  latest: string;
  ovulationDay: string;
  fertileStart: string;
  fertileEnd: string;
};

export type SymptomPattern = { symptom: CycleSymptom; phase: CyclePhase; count: number; share: number };

export type CycleSummary = {
  periods: CyclePeriod[];
  current: CyclePeriod | null;
  currentEnd: string | null;
  autoEnded: boolean;
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleVariation: number | null;
  /** 0 means the typical lengths are the defaults (28 and 5 days). */
  cyclesUsed: number;
  cycleDay: number | null;
  phase: CyclePhase;
  nextPeriodStart: string | null;
  /** Negative when the period is late. */
  nextPeriodInDays: number | null;
  ovulationDay: string | null;
  fertileStart: string | null;
  fertileEnd: string | null;
  predictions: CyclePrediction[];
  notes: CycleNote[];
  patterns: SymptomPattern[];
  today: CycleDay | null;
};

/** Matches the backend. */
export const CYCLE_LIMITS = { backdateDays: 90, note: 300 } as const;
