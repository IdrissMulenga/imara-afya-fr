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

export type CyclePrediction = {
  basedOnCycles: number;
  averageCycleLength: number;
  nextPeriodDate?: string | null;
  daysUntilNextPeriod?: number | null;
  daysUntilFertileWindow?: number | null;
};

export type Hospital = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
};

/* ---------------------- health operation results --------------------- */

export type DashboardData = {
  me: User;
  myHealthRecords: HealthRecord[];
  myMedications: Medication[];
  myMedicationLogs: MedicationDose[];
};

export type CyclePredictionData = { cyclePrediction: CyclePrediction };
export type MyHealthRecordsData = { myHealthRecords: HealthRecord[] };
export type MyMedicationsData = { myMedications: Medication[] };
export type NearbyHospitalsData = { nearbyHospitals: Hospital[] };
export type MarkMedicationTakenData = { markMedicationTaken: MedicationDose };
