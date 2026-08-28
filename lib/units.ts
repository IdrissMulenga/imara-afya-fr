// lib/units.ts — showing metric numbers in whichever units the person reads.
//
// STORAGE IS ALWAYS METRIC. Kilograms, centimetres, millilitres — that is what
// the backend holds and what every calculation uses. Only the display converts.
//
// Doing it the other way round, storing whatever the user last chose, means a
// weight history that silently mixes kg and lb, and a BMI that is wrong for
// anyone who ever changed the setting.
export type UnitSystem = 'metric' | 'imperial';

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;
const ML_PER_FL_OZ = 29.5735295625;

/** kilograms -> the number to show */
export const displayWeight = (kg: number, units: UnitSystem) =>
  units === 'imperial' ? kg / KG_PER_LB : kg;

/** the number the user typed -> kilograms, for storage */
export const toKg = (value: number, units: UnitSystem) =>
  units === 'imperial' ? value * KG_PER_LB : value;

/** centimetres -> the number to show */
export const displayHeight = (cm: number, units: UnitSystem) =>
  units === 'imperial' ? cm / CM_PER_INCH : cm;

export const toCm = (value: number, units: UnitSystem) =>
  units === 'imperial' ? value * CM_PER_INCH : value;

/** millilitres -> the number to show */
export const displayVolume = (ml: number, units: UnitSystem) =>
  units === 'imperial' ? ml / ML_PER_FL_OZ : ml;

export const toMl = (value: number, units: UnitSystem) =>
  units === 'imperial' ? value * ML_PER_FL_OZ : value;

/**
 * Imperial height reads as feet and inches, not as 69 inches. Returns the two
 * parts so the caller can format them however the layout needs.
 */
export const feetAndInches = (cm: number) => {
  const totalInches = Math.round(cm / CM_PER_INCH);

  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
};

/** Unit labels. Not translated — kg, lb, cm and oz are the same everywhere. */
export const unitLabels = (units: UnitSystem) =>
  units === 'imperial'
    ? { weight: 'lb', height: 'in', volume: 'fl oz' }
    : { weight: 'kg', height: 'cm', volume: 'ml' };

/**
 * One decimal for weight, none for height. Enough precision to see a change
 * week to week, not so much that it implies a bathroom scale is a laboratory.
 */
export const round1 = (value: number) => Math.round(value * 10) / 10;
