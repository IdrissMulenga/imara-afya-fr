// graphql/queries/wellness.ts — daily habits and the guidance library.
import { gql } from '@apollo/client';

import { CHECK_IN_FIELDS, PREGNANCY_FIELDS, ROUTINE_FIELDS } from '../fragments';

// Today's water / sleep / weight plus the streak and BMI the backend computes.
export const HABIT_SUMMARY = gql`
  query HabitSummary {
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
  }
`;

// Raw entries for trends — type is "water" | "sleep" | "weight".
export const MY_HABIT_LOGS = gql`
  query MyHabitLogs($type: String!, $from: String, $to: String) {
    myHabitLogs(type: $type, from: $from, to: $to) {
      id
      type
      value
      date
    }
  }
`;

// Published guidance articles, optionally narrowed by category / language.
export const GUIDANCE = gql`
  query Guidance($category: String, $language: String) {
    guidance(category: $category, language: $language) {
      id
      category
      kind
      title
      body
      source
      language
    }
  }
`;

/* ------------------------- daily check-in ------------------------- */

// The dashboard card: today's entry plus the streak and rolling averages the
// backend already computes, so the app never has to do the maths.
export const CHECK_IN_SUMMARY = gql`
  query CheckInSummary($days: Int) {
    checkInSummary(days: $days) { ${CHECK_IN_FIELDS} }
  }
`;

export const MY_CHECK_INS = gql`
  query MyCheckIns($from: String, $to: String) {
    myCheckIns(from: $from, to: $to) { id date mood energy note }
  }
`;

/* -------------------------- daily routines ------------------------- */

// What's due on a given day, with each routine's tick state and its streak.
export const TODAY_ROUTINES = gql`
  query TodayRoutines($date: String) {
    todayRoutines(date: $date) {
      date
      doneCount
      dueCount
      routines { ${ROUTINE_FIELDS} }
    }
  }
`;

// The full list, including archived ones, for the manage screen.
export const MY_ROUTINES = gql`
  query MyRoutines($includeArchived: Boolean) {
    myRoutines(includeArchived: $includeArchived) {
      id title icon days time active position
    }
  }
`;

/* -------------------------- pregnancy ------------------------------ */

// Women only — the backend rejects this with WOMEN_ONLY for other users.
export const PREGNANCY_PROGRESS = gql`
  query PregnancyProgress {
    pregnancyProgress { ${PREGNANCY_FIELDS} }
  }
`;

export const MY_PREGNANCIES = gql`
  query MyPregnancies {
    myPregnancies { id lastPeriodDate endedAt outcome note }
  }
`;
