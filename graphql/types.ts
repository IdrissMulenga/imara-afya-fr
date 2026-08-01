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
  religion?: string | null;
  plan: Plan;
  waterGoal?: number | null;
  cycleRegularity?: string | null;
  ramadanMode?: boolean | null;
  suhoorTime?: string | null;
  iftarTime?: string | null;
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
  religion?: string;
};

/* ------------------------ operation variables ----------------------- */

export type SignupVars = { input: SignUpInput };
export type LoginVars = { input: LoginInput };
export type CompleteProfileVars = { input: CompleteProfileInput };

/* -------------------------- operation results ----------------------- */

export type SignupData = { signup: AuthPayload };
export type LoginData = { login: AuthPayload };
export type CompleteProfileData = { completeProfile: User };
export type UpgradeToPremiumData = { upgradeToPremium: User };
export type MeData = { me: User };

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
  frequency: string;
  active: boolean;
};

export type MedicationDose = {
  id: string;
  medicationId: string;
  status: string; // "taken" | "skipped"
  takenAt: string;
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

/* ------------------------------ ramadan mode ------------------------------ */

export type AdjustedMedication = {
  id: string;
  name: string;
  originalTimes: string[];
  adjustedTimes: string[];
};

export type RamadanSchedule = {
  enabled: boolean;
  suhoorTime?: string | null;
  iftarTime?: string | null;
  medications: AdjustedMedication[];
};

export type SetRamadanModeInput = {
  enabled: boolean;
  suhoorTime?: string;
  iftarTime?: string;
};

/* -------------------------------- guidance -------------------------------- */

export type Guidance = {
  id: string;
  category: string;
  // "religious" entries always carry a source; "medical" ones may not
  kind: string;
  title: string;
  body: string;
  source?: string | null;
  language: string;
};

export type FacilityType = 'hospital' | 'clinic' | 'pharmacy';

export type Hospital = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  latitude: number;
  longitude: number;
  city?: string | null;
  province?: string | null;
  type?: string | null;
  // only returned by nearbyHospitals, which needs the user's coordinates
  distanceKm?: number | null;
};

/* ---------------------- health operation results --------------------- */

export type DashboardData = {
  me: User;
  myHealthRecords: HealthRecord[];
  myMedications: Medication[];
  myMedicationLogs: MedicationDose[];
  habitSummary: HabitSummary;
  myHabitLogs: HabitLog[];
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
export type NearbyHospitalsData = { nearbyHospitals: Hospital[] };
export type HospitalsData = { hospitals: Hospital[] };
export type HabitSummaryData = { habitSummary: HabitSummary };
export type MyHabitLogsData = { myHabitLogs: HabitLog[] };
export type LogHabitData = { logHabit: HabitLog };
export type RemoveHabitLogData = { removeHabitLog: boolean };
export type SetWaterGoalData = { setWaterGoal: User };
export type RamadanScheduleData = { ramadanSchedule: RamadanSchedule };
export type SetRamadanModeData = { setRamadanMode: User };
export type GuidanceData = { guidance: Guidance[] };
export type MarkMedicationTakenData = { markMedicationTaken: MedicationDose };
