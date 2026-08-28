// graphql/queries/health.ts — dashboard + health feature queries.
import { gql } from '@apollo/client';

import {
  ADHERENCE_FIELDS, CHECK_IN_FIELDS, CYCLE_FIELDS, MEDICATION_FIELDS,
  PREGNANCY_FIELDS, ROUTINE_FIELDS, USER_FIELDS,
} from '../fragments';

// One round trip for everything the dashboard needs (kind to slow networks).
// `date` is today's YYYY-MM-DD so we know which doses are already logged.
export const DASHBOARD = gql`
  query Dashboard($date: String, $weekAgo: String) {
    me { ${USER_FIELDS} }
    myHealthRecords { id type name }
    myMedications { ${MEDICATION_FIELDS} }
    myMedicationLogs(date: $date) { id medicationId status takenAt slot }
    habitSummary {
      date
      waterToday
      waterGoal
      waterGoalMet
      waterStreak
      sleepLastNight
      latestWeight
      bmi
      bmiCategory
    }
    # last seven days of water, for the trend chart
    myHabitLogs(type: "water", from: $weekAgo) { id value date }
    # how you said you were feeling today, plus the streak behind it
    checkInSummary { ${CHECK_IN_FIELDS} }
    # what you decided to do today — the dashboard ticks these off in place
    todayRoutines(date: $date) {
      date
      doneCount
      dueCount
      routines { ${ROUTINE_FIELDS} }
    }
  }
`;

// WOMEN ONLY — cyclePrediction and pregnancyProgress both throw WOMEN_ONLY for
// everyone else, so this is skipped unless gender is "Woman".
//
// The two travel together rather than as separate requests: a woman opening the
// dashboard would otherwise pay for three round trips before the screen
// settles, and on 2G that is three chances to stall instead of two.
export const DASHBOARD_WOMEN = gql`
  query DashboardWomen {
    cyclePrediction { ${CYCLE_FIELDS} }
    pregnancyProgress { ${PREGNANCY_FIELDS} }
  }
`;

// Women only — the backend rejects this for other users (WOMEN_ONLY), so the
// caller must skip it unless gender is "Woman".
export const CYCLE_PREDICTION = gql`
  query CyclePrediction {
    cyclePrediction { ${CYCLE_FIELDS} }
  }
`;

// How much of what was DUE actually got taken. The denominator comes from each
// medicine's own frequency and course dates, which is why it is a server
// computation rather than something the app tallies from the log list.
export const MEDICATION_ADHERENCE = gql`
  query MedicationAdherence($days: Int, $medicationId: ID) {
    medicationAdherence(days: $days, medicationId: $medicationId) { ${ADHERENCE_FIELDS} }
  }
`;

export const MY_HEALTH_RECORDS = gql`
  query MyHealthRecords($type: String) {
    myHealthRecords(type: $type) {
      id
      type
      name
      note
      attachments { id url name }
    }
  }
`;

export const MY_MEDICATIONS = gql`
  query MyMedications {
    myMedications { ${MEDICATION_FIELDS} }
  }
`;

// Women only — same WOMEN_ONLY guard as cyclePrediction.
export const MY_CYCLES = gql`
  query MyCycles {
    myCycles { id startDate endDate }
  }
`;

