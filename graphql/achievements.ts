// Achievements: badges with progress and personal bests, computed from the whole history. Field
// names match the backend achievement.typeDefs.ts.
import { gql } from '@apollo/client';

export const ACHIEVEMENTS = gql`
  query Achievements {
    achievements {
      earnedCount
      badges {
        id
        kind
        metric
        target
        progress
        earned
        earnedOn
      }
      mostSteps {
        value
        day
      }
      mostWater {
        value
        day
      }
      longestSleep {
        value
        day
      }
      longestStreaks {
        water
        steps
        sleep
        checkIn
      }
    }
  }
`;

export type StreakMetric = 'WATER' | 'STEPS' | 'SLEEP' | 'CHECKIN';
export type BadgeKind = 'FIRST_CHECKIN' | 'FIRST_WEEK' | 'STREAK' | 'WEIGHT_GOAL';

/** Earned once progress reaches target; earnedOn is YYYY-MM-DD, null when not earned or unknown. */
export type Badge = {
  id: string;
  kind: BadgeKind;
  metric: StreakMetric | null;
  target: number;
  progress: number;
  earned: boolean;
  earnedOn: string | null;
};

export type PersonalBest = { value: number; day: string };

export type Achievements = {
  earnedCount: number;
  badges: Badge[];
  mostSteps: PersonalBest | null;
  mostWater: PersonalBest | null;
  longestSleep: PersonalBest | null;
  longestStreaks: { water: number; steps: number; sleep: number; checkIn: number };
};
