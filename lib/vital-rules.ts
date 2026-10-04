// How a reading is classed and what to do about it, for readings saved offline, which the server
// cannot class until they are sent. The same rules as the backend's vital.service.ts
// (assessPressure, assessGlucose, assessPulse); keep the two in step.
import type { GlucoseContext, VitalAdvice, VitalCategory, VitalKind } from '@/graphql/vitals';

type Assessment = { category: VitalCategory; advice: VitalAdvice };

const ADVICE_ORDER: VitalAdvice[] = ['NONE', 'RECHECK', 'SEE_HEALTH_WORKER', 'URGENT'];

/** Blood pressure in mmHg (ISH 2020); the higher category of the two numbers. Under 90/60 is low. */
export const assessPressure = (systolic: number, diastolic: number): Assessment => {
  if (systolic >= 180 || diastolic >= 110) return { category: 'SEVERE', advice: 'URGENT' };
  if (systolic >= 160 || diastolic >= 100) return { category: 'HIGH_GRADE_2', advice: 'SEE_HEALTH_WORKER' };
  if (systolic >= 140 || diastolic >= 90) return { category: 'HIGH_GRADE_1', advice: 'RECHECK' };
  if (systolic >= 130 || diastolic >= 85) return { category: 'HIGH_NORMAL', advice: 'NONE' };
  if (systolic < 90 || diastolic < 60) return { category: 'LOW', advice: 'RECHECK' };
  return { category: 'NORMAL', advice: 'NONE' };
};

/** Blood glucose in mmol/L by when it was measured; under 3.0 and 16.7 and over are urgent. */
export const assessGlucose = (mmol: number, context: GlucoseContext): Assessment => {
  if (mmol < 3.0) return { category: 'VERY_LOW', advice: 'URGENT' };
  if (mmol < 3.9) return { category: 'LOW', advice: 'RECHECK' };
  if (mmol >= 16.7) return { category: 'VERY_HIGH', advice: 'URGENT' };
  const [raisedFrom, highFrom] =
    context === 'FASTING' ? [5.6, 7.0] : context === 'AFTER_MEAL' ? [7.8, 11.1] : [11.1, 11.1];
  if (mmol >= highFrom) return { category: 'HIGH', advice: 'SEE_HEALTH_WORKER' };
  if (mmol >= raisedFrom) return { category: 'RAISED', advice: 'RECHECK' };
  return { category: 'NORMAL', advice: 'NONE' };
};

/** Resting pulse in beats per minute. */
export const assessPulse = (bpm: number): Assessment => {
  if (bpm < 40) return { category: 'VERY_LOW', advice: 'SEE_HEALTH_WORKER' };
  if (bpm < 50) return { category: 'LOW', advice: 'NONE' };
  if (bpm > 120) return { category: 'VERY_HIGH', advice: 'SEE_HEALTH_WORKER' };
  if (bpm > 100) return { category: 'HIGH', advice: 'RECHECK' };
  return { category: 'NORMAL', advice: 'NONE' };
};

/** The category of a reading's main measure, its pulse's category, and the most serious advice. */
export const assessReading = (input: {
  kind: VitalKind;
  systolic?: number | null;
  diastolic?: number | null;
  pulse?: number | null;
  glucoseMmol?: number | null;
  glucoseContext?: GlucoseContext | null;
}): { category: VitalCategory; pulseCategory: VitalCategory | null; advice: VitalAdvice } => {
  const pulse = input.pulse != null ? assessPulse(input.pulse) : null;
  const main =
    input.kind === 'BLOOD_PRESSURE'
      ? assessPressure(input.systolic ?? 0, input.diastolic ?? 0)
      : input.kind === 'GLUCOSE'
        ? assessGlucose(input.glucoseMmol ?? 0, input.glucoseContext ?? 'RANDOM')
        : (pulse ?? { category: 'NORMAL' as VitalCategory, advice: 'NONE' as VitalAdvice });
  const advice = [main.advice, pulse?.advice ?? 'NONE'].reduce((worst, next) =>
    ADVICE_ORDER.indexOf(next) > ADVICE_ORDER.indexOf(worst) ? next : worst
  );
  return { category: main.category, pulseCategory: pulse?.category ?? null, advice };
};
