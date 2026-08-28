// graphql/types.ts — TypeScript types mirroring the backend GraphQL schema.
// Keep these in sync with imara-afya-backend/src/graphql/schemas/types/*.ts

export type Gender = 'Man' | 'Woman';
export type Plan = 'free' | 'premium';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  agreedToTerms: boolean;
  image?: string | null;
  height?: number | null;
  weight?: number | null;
  gender?: string | null;
  plan: Plan;
  waterGoal?: number | null;
  cycleRegularity?: string | null;
  // IANA name, e.g. "Africa/Bujumbura". The app pushes this on launch.
  timezone?: string | null;
  unitSystem?: string | null;
};

export type AuthPayload = {
  token: string;
  user: User;
};

/* ------------------------------ inputs ------------------------------ */

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: Gender;
  agreeToTerms: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type CompleteProfileInput = {
  firstName?: string;
  lastName?: string;
  image?: string;
  height?: number;
  weight?: number;
};

/* ------------------------ operation variables ----------------------- */

export type SignupVars = { input: SignUpInput };
export type LoginVars = { input: LoginInput };
export type CompleteProfileVars = { input: CompleteProfileInput };

/* -------------------------- operation results ----------------------- */

export type SignupData = { signup: AuthPayload };
export type LoginData = { login: AuthPayload };
export type RefreshSessionData = { refreshSession: AuthPayload };
export type LogoutData = { logout: boolean };
export type CompleteProfileData = { completeProfile: User };
export type UpgradeToPremiumData = { upgradeToPremium: User };
export type DeleteAccountData = { deleteAccount: boolean };
export type MeData = { me: User };
export type SetPreferencesData = { setPreferences: User };
export type ChangePasswordData = { changePassword: AuthPayload };
export type RequestPasswordResetData = { requestPasswordReset: boolean };
export type ResetPasswordData = { resetPassword: AuthPayload };

export type ChangePasswordInput = { currentPassword: string; newPassword: string };
export type ResetPasswordInput = { email: string; token: string; newPassword: string };

/* --------------------------- health features ------------------------- */

export type HealthRecordType = 'Condition' | 'Allergy' | 'Medication';

export type Attachment = { id: string; url: string; name?: string | null };

export type HealthRecord = {
  id: string;
  type: string;
  name: string;
  note?: string | null;
  attachments?: Attachment[];
};

export type Medication = {
  id: string;
  name: string;
  dosage?: string | null;
  times: string[];
  /** "daily" | "alternate" | "specificDays" */
  frequency: string;
  /** weekday numbers, 0 = Sunday. Only meaningful for "specificDays". */
  days: number[];
  startDate?: string | null;
  endDate?: string | null;
  stock?: number | null;
  stockPerDose?: number | null;
  refillAtDays?: number | null;
  /** computed by the server from stock and this medicine's own rate */
  daysOfStockLeft?: number | null;
  dueToday: boolean;
  active: boolean;
};

export type MedicationInput = {
  name: string;
  dosage?: string;
  times?: string[];
  frequency?: string;
  days?: number[];
  startDate?: string;
  endDate?: string;
  stock?: number;
  stockPerDose?: number;
  refillAtDays?: number;
  active?: boolean;
};

export type AdherenceDay = { date: string; due: number; taken: number };
export type AdherenceSlot = { slot: string; due: number; taken: number };

export type AdherenceSummary = {
  from: string;
  to: string;
  due: number;
  taken: number;
  /** 0-100, or null when nothing was due in the window */
  percent?: number | null;
  streak: number;
  days: AdherenceDay[];
  bySlot: AdherenceSlot[];
};

export type MedicationAdherenceData = { medicationAdherence: AdherenceSummary };

export type MedicationDose = {
  id: string;
  medicationId: string;
  status: string; // "taken" | "skipped"
  takenAt: string;
  // which scheduled time this dose belongs to, e.g. "08:00".
  // null for a medicine with no set times, taken as needed.
  slot?: string | null;
  // the user's own calendar day, not a UTC one
  localDate?: string;
};

// A medicine plus ONE of its scheduled times. This is the unit the dashboard
// actually renders — a twice-daily medicine produces two of these, each ticked
// independently.
/**
 * WHERE A DOSE STANDS RIGHT NOW.
 *
 *   upcoming  its time hasn't come yet
 *   due       it's time, or within the hour of grace
 *   late      more than an hour past, still worth taking
 *   missed    far enough past that today is gone
 *   taken     recorded
 */
export type DueDoseStatus = 'upcoming' | 'due' | 'late' | 'missed' | 'taken';

export type DueDose = {
  key: string;
  medicationId: string;
  name: string;
  dosage?: string | null;
  // null for an as-needed medicine with no schedule
  slot: string | null;
  taken: boolean;
  status: DueDoseStatus;
};

export type PeriodCycle = {
  id: string;
  startDate: string;
  endDate?: string | null;
};

export type CyclePrediction = {
  basedOnCycles: number;
  averageCycleLength: number;
  // null until she has closed at least one period
  averagePeriodLength?: number | null;
  // spread between her shortest and longest cycle, in days
  cycleVariation?: number | null;
  // how much the countdown is worth trusting
  confidence: 'high' | 'medium' | 'low';
  // her own answer
  regularity: 'regular' | 'irregular' | 'unknown';
  // her logged data itself looks irregular enough to mention to a clinician
  irregularityFlag: boolean;
  nextPeriodDate?: string | null;
  fertileWindowStart?: string | null;
  fertileWindowEnd?: string | null;
  daysUntilNextPeriod?: number | null;
  daysUntilFertileWindow?: number | null;
};

/* ------------------------------ daily habits ------------------------------ */

export type HabitType = 'water' | 'sleep' | 'weight';

export type HabitLog = {
  id: string;
  type: string;
  value: number;
  date: string;
};

export type HabitSummary = {
  date: string;
  waterToday: number;
  waterGoal: number;
  waterGoalMet: boolean;
  waterStreak: number;
  sleepLastNight?: number | null;
  latestWeight?: number | null;
  bmi?: number | null;
  bmiCategory?: string | null;
};

export type LogHabitInput = {
  type: HabitType;
  value: number;
  date?: string;
};

/* -------------------------------- guidance -------------------------------- */

export type Guidance = {
  id: string;
  category: string;
  // always "medical" now that religious content has been removed
  kind: string;
  title: string;
  body: string;
  source?: string | null;
  language: string;
};

/* ---------------------- health operation results --------------------- */

export type DashboardData = {
  me: User;
  myHealthRecords: HealthRecord[];
  myMedications: Medication[];
  myMedicationLogs: MedicationDose[];
  habitSummary: HabitSummary;
  myHabitLogs: HabitLog[];
  checkInSummary: CheckInSummary;
  todayRoutines: RoutineDay;
};

// Everything on the dashboard that only applies to women. Fetched as one
// request, skipped entirely for everyone else — the backend answers both of
// these with WOMEN_ONLY rather than with null.
export type DashboardWomenData = {
  cyclePrediction: CyclePrediction;
  pregnancyProgress: PregnancyProgress;
};

export type AddHealthRecordInput = {
  type: string;
  name: string;
  note?: string;
};

export type UpdateHealthRecordInput = {
  name?: string;
  note?: string;
};

export type AddHealthRecordVars = { input: AddHealthRecordInput };
export type UpdateHealthRecordVars = { id: string; input: UpdateHealthRecordInput };
export type RemoveHealthRecordVars = { id: string };

export type AddHealthRecordData = { addHealthRecord: HealthRecord };
export type UpdateHealthRecordData = { updateHealthRecord: HealthRecord };
export type RemoveHealthRecordData = { removeHealthRecord: boolean };

export type AddMedicationInput = {
  name: string;
  dosage?: string;
  times?: string[];
  frequency?: string;
};

export type UpdateMedicationInput = {
  name?: string;
  dosage?: string;
  times?: string[];
  frequency?: string;
  active?: boolean;
};

export type LogPeriodInput = {
  startDate: string;
  endDate?: string;
};

export type UpdatePeriodInput = {
  startDate?: string;
  endDate?: string;
};

export type UpdatePeriodData = { updatePeriod: PeriodCycle };
export type SetCycleRegularityData = { setCycleRegularity: User };
export type RemovePeriodData = { removePeriod: boolean };

export type AddMedicationData = { addMedication: Medication };
export type UpdateMedicationData = { updateMedication: Medication };
export type RemoveMedicationData = { removeMedication: boolean };
export type LogPeriodData = { logPeriod: PeriodCycle };
export type MyCyclesData = { myCycles: PeriodCycle[] };

export type CyclePredictionData = { cyclePrediction: CyclePrediction };
export type MyHealthRecordsData = { myHealthRecords: HealthRecord[] };
export type MyMedicationsData = { myMedications: Medication[] };
export type HabitSummaryData = { habitSummary: HabitSummary };
export type MyHabitLogsData = { myHabitLogs: HabitLog[] };
export type LogHabitData = { logHabit: HabitLog };
export type RemoveHabitLogData = { removeHabitLog: boolean };
export type SetWaterGoalData = { setWaterGoal: User };
export type GuidanceData = { guidance: Guidance[] };
export type MarkMedicationTakenData = { markMedicationTaken: MedicationDose };
export type UnmarkMedicationTakenData = { unmarkMedicationTaken: boolean };

/* --------------------------- daily check-in --------------------------- */

export type CheckIn = {
  id: string;
  date: string;
  // 1 = worst, 5 = best
  mood: number;
  energy: number;
  note?: string | null;
};

export type CheckInSummary = {
  // null until she has checked in today
  today?: CheckIn | null;
  streak: number;
  averageMood?: number | null;
  averageEnergy?: number | null;
  loggedDays: number;
  windowDays: number;
};

export type CheckInInput = {
  mood: number;
  energy: number;
  note?: string;
  date?: string;
};

export type CheckInSummaryData = { checkInSummary: CheckInSummary };
export type MyCheckInsData = { myCheckIns: CheckIn[] };
export type SaveCheckInData = { saveCheckIn: CheckIn };
export type RemoveCheckInData = { removeCheckIn: boolean };

/* ---------------------------- daily routines --------------------------- */

export type Routine = {
  id: string;
  title: string;
  icon: string;
  // 0 = Sunday .. 6 = Saturday. Empty means every day.
  days: number[];
  time?: string | null;
  active: boolean;
  position: number;
  // only present on todayRoutines / setRoutineDone
  done?: boolean | null;
  streak?: number | null;
};

export type RoutineDay = {
  date: string;
  routines: Routine[];
  doneCount: number;
  dueCount: number;
};

export type RoutineInput = {
  title: string;
  icon?: string;
  days?: number[];
  time?: string;
};

export type UpdateRoutineInput = {
  title?: string;
  icon?: string;
  days?: number[];
  time?: string;
  active?: boolean;
  position?: number;
};

export type TodayRoutinesData = { todayRoutines: RoutineDay };
export type MyRoutinesData = { myRoutines: Routine[] };
export type AddRoutineData = { addRoutine: Routine };
export type UpdateRoutineData = { updateRoutine: Routine };
export type RemoveRoutineData = { removeRoutine: boolean };
export type SetRoutineDoneData = { setRoutineDone: Routine };

/* ------------------------------ pregnancy ------------------------------ */

export type Pregnancy = {
  id: string;
  lastPeriodDate: string;
  // set once the pregnancy has ended, whatever the outcome
  endedAt?: string | null;
  outcome?: string | null;
  note?: string | null;
};

export type PregnancyProgress = {
  active: boolean;
  pregnancy?: Pregnancy | null;
  dueDate?: string | null;
  weeksPregnant?: number | null;
  daysIntoWeek?: number | null;
  trimester?: number | null;
  daysUntilDue?: number | null;
  overdue?: boolean | null;
};

export type StartPregnancyInput = { lastPeriodDate: string; note?: string };
export type UpdatePregnancyInput = { lastPeriodDate?: string; note?: string };
export type EndPregnancyInput = { endedAt?: string; outcome?: string; note?: string };

export type PregnancyProgressData = { pregnancyProgress: PregnancyProgress };
export type MyPregnanciesData = { myPregnancies: Pregnancy[] };
export type StartPregnancyData = { startPregnancy: Pregnancy };
export type UpdatePregnancyData = { updatePregnancy: Pregnancy };
export type EndPregnancyData = { endPregnancy: Pregnancy };
export type RemovePregnancyData = { removePregnancy: boolean };

/* --------------------------- record attachments ------------------------ */

export type AddAttachmentInput = { url: string; name?: string };

export type AddAttachmentData = { addAttachment: HealthRecord };
export type RemoveAttachmentData = { removeAttachment: HealthRecord };
