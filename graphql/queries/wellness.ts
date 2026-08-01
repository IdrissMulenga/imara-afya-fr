// graphql/queries/wellness.ts — daily habits, Ramadan mode, guidance library.
import { gql } from '@apollo/client';

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

// Ramadan settings + what each medication's dose times become while fasting.
export const RAMADAN_SCHEDULE = gql`
  query RamadanSchedule {
    ramadanSchedule {
      enabled
      suhoorTime
      iftarTime
      medications {
        id
        name
        originalTimes
        adjustedTimes
      }
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
