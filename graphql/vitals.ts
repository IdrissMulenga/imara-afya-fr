// Vitals: blood pressure, blood sugar and pulse readings, each classed with advice. Field names
// match the backend vital.typeDefs.ts.
import { gql } from '@apollo/client';

export const VITAL_FIELDS = gql`
  fragment VitalFields on VitalReading {
    id
    kind
    day
    at
    systolic
    diastolic
    pulse
    glucoseMmol
    glucoseContext
    note
    category
    pulseCategory
    advice
  }
`;

export const VITAL_SUMMARY = gql`
  ${VITAL_FIELDS}
  query VitalSummary {
    vitalSummary {
      latestPressure {
        ...VitalFields
      }
      latestGlucose {
        ...VitalFields
      }
      latestPulse {
        ...VitalFields
      }
      pressureWeek {
        days
        readings
        systolic
        diastolic
        category
      }
    }
  }
`;

export const VITALS = gql`
  ${VITAL_FIELDS}
  query Vitals($days: Int, $kind: VitalKind) {
    vitals(days: $days, kind: $kind) {
      ...VitalFields
    }
  }
`;

export const LOG_VITAL = gql`
  ${VITAL_FIELDS}
  mutation LogVital($input: LogVitalInput!) {
    logVital(input: $input) {
      ...VitalFields
    }
  }
`;

export const DELETE_VITAL = gql`
  mutation DeleteVital($id: ID!) {
    deleteVital(id: $id)
  }
`;

export type VitalKind = 'BLOOD_PRESSURE' | 'GLUCOSE' | 'PULSE';
export type GlucoseContext = 'FASTING' | 'AFTER_MEAL' | 'RANDOM';
export type VitalCategory =
  | 'VERY_LOW'
  | 'LOW'
  | 'NORMAL'
  | 'HIGH_NORMAL'
  | 'RAISED'
  | 'HIGH'
  | 'HIGH_GRADE_1'
  | 'HIGH_GRADE_2'
  | 'SEVERE'
  | 'VERY_HIGH';
/** URGENT means seek care now. One reading is not a diagnosis. */
export type VitalAdvice = 'NONE' | 'RECHECK' | 'SEE_HEALTH_WORKER' | 'URGENT';

export type VitalReading = {
  __typename?: 'VitalReading';
  id: string;
  kind: VitalKind;
  day: string;
  at: string;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  glucoseMmol: number | null;
  glucoseContext: GlucoseContext | null;
  note: string;
  category: VitalCategory;
  pulseCategory: VitalCategory | null;
  advice: VitalAdvice;
};

export type PressureAverage = {
  days: number;
  readings: number;
  systolic: number | null;
  diastolic: number | null;
  category: VitalCategory | null;
};

export type VitalSummary = {
  latestPressure: VitalReading | null;
  latestGlucose: VitalReading | null;
  latestPulse: VitalReading | null;
  pressureWeek: PressureAverage;
};

/** Matches the backend limits. */
export const VITAL_LIMITS = {
  systolic: [50, 300],
  diastolic: [30, 200],
  pulse: [25, 250],
  glucose: [1, 40],
} as const;
