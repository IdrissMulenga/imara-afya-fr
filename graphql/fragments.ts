// graphql/fragments.ts — shared field selections so every operation returns
// the same User shape (and one place to edit when the model changes).
export const USER_FIELDS = `
  id
  firstName
  lastName
  email
  agreedToTerms
  image
  height
  weight
  gender
  plan
  waterGoal
  cycleRegularity
  timezone
  unitSystem
`;

// The rest of these exist because the dashboard asks for the same shapes as the
// dedicated screens do. Written once so the two can't drift — a field added to
// the cycle screen and forgotten on the dashboard is how a card ends up
// rendering `undefined` on one screen and a number on the other.

export const MEDICATION_FIELDS = `
  id
  name
  dosage
  times
  frequency
  days
  startDate
  endDate
  stock
  stockPerDose
  refillAtDays
  daysOfStockLeft
  dueToday
  active
`;

export const ADHERENCE_FIELDS = `
  from
  to
  due
  taken
  percent
  streak
  days { date due taken }
  bySlot { slot due taken }
`;

export const CHECK_IN_FIELDS = `
  today { id date mood energy note }
  streak
  averageMood
  averageEnergy
  loggedDays
  windowDays
`;

export const ROUTINE_FIELDS = `
  id
  title
  icon
  days
  time
  active
  position
  done
  streak
`;

export const CYCLE_FIELDS = `
  basedOnCycles
  averageCycleLength
  averagePeriodLength
  cycleVariation
  confidence
  regularity
  irregularityFlag
  nextPeriodDate
  fertileWindowStart
  fertileWindowEnd
  daysUntilNextPeriod
  daysUntilFertileWindow
`;

export const PREGNANCY_FIELDS = `
  active
  pregnancy { id lastPeriodDate endedAt outcome note }
  dueDate
  weeksPregnant
  daysIntoWeek
  trimester
  daysUntilDue
  overdue
`;
