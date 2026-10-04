// Vitals UI: a reading's value as text, the words and colour for its category, and what to do
// about it, including the urgent messages for readings that need care now.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import type { VitalAdvice, VitalCategory, VitalReading } from '@/graphql/vitals';

const num = (value: number): string => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

/** "148/92 mmHg", "6.2 mmol/L" or "72 bpm". */
export const readingValue = (reading: VitalReading): string => {
  if (reading.kind === 'BLOOD_PRESSURE') return `${reading.systolic}/${reading.diastolic} mmHg`;
  if (reading.kind === 'GLUCOSE') return `${num(reading.glucoseMmol ?? 0)} mmol/L`;
  return `${reading.pulse} bpm`;
};

/** The category in words. Blood pressure and glucose use their own words for the same codes. */
export const categoryText = (category: VitalCategory, a: AppCopy): string =>
  ({
    VERY_LOW: a.vitalVeryLow,
    LOW: a.vitalLow,
    NORMAL: a.vitalNormal,
    HIGH_NORMAL: a.vitalHighNormal,
    RAISED: a.vitalRaised,
    HIGH: a.vitalHigh,
    HIGH_GRADE_1: a.vitalHighGrade1,
    HIGH_GRADE_2: a.vitalHighGrade2,
    SEVERE: a.vitalSevere,
    VERY_HIGH: a.vitalVeryHigh,
  })[category];

/** green for normal, neutral for borderline, red for anything that needs care. */
export const useCategoryColor = () => {
  const { c } = useTheme();
  return (category: VitalCategory | null): string => {
    if (category == null) return c.faint;
    if (category === 'NORMAL') return c.success;
    if (category === 'HIGH_NORMAL' || category === 'LOW') return c.text;
    return c.danger;
  };
};

/** What to do about a reading. Urgent advice depends on what was measured. */
export const adviceText = (reading: VitalReading, a: AppCopy): string | null => {
  const advice: VitalAdvice = reading.advice;
  if (advice === 'NONE') return null;
  if (advice === 'URGENT') {
    if (reading.kind === 'GLUCOSE') {
      return reading.category === 'VERY_LOW' ? a.vitalUrgentLowSugar : a.vitalUrgentHighSugar;
    }
    return a.vitalUrgentPressure;
  }
  return advice === 'SEE_HEALTH_WORKER' ? a.vitalSeeHealthWorker : a.vitalRecheck;
};

/** The advice for a reading in a coloured box; nothing when there is none. */
export function AdviceBox({ reading }: { reading: VitalReading }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const text = adviceText(reading, APP_COPY[lang]);
  if (!text) return null;
  const urgent = reading.advice === 'URGENT';
  const tone = urgent || reading.advice === 'SEE_HEALTH_WORKER' ? c.danger : c.text;
  return (
    <View style={[styles.box, { borderColor: `${tone}55`, backgroundColor: urgent ? `${c.danger}1A` : c.track }]}>
      <MaterialCommunityIcons name={urgent ? 'alert' : 'information-outline'} size={18} color={tone} style={{ marginTop: 1 }} />
      <Text style={[urgent ? T.body : T.fine, { color: c.text, flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
});
