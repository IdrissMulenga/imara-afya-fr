// Vitals UI: a reading's value as text, the words and colour for its category, and what to do
// about it, including the urgent messages for readings that need care now.
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { QuietButton } from '@/components/ui';
import { useLang, numberLocale } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import {
  VITAL_SUMMARY,
  type VitalAdvice,
  type VitalCategory,
  type VitalReading,
  type VitalSummary,
} from '@/graphql/vitals';

const num = (value: number): string => value.toLocaleString(numberLocale(), { maximumFractionDigits: 1 });

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

/** The newest blood pressure, sugar and pulse readings. */
export function useVitalSummary() {
  return useQuery<{ vitalSummary: VitalSummary }>(VITAL_SUMMARY);
}

// One value on the dashboard card: label, number with its unit, and its status in colour.
function Metric({
  label,
  value,
  unit,
  status,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  status: string | null;
  color: string;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.metric}>
      <Text style={[T.fine, { color: c.muted }]}>{label}</Text>
      <Text style={{ fontFamily: font.displayBold, fontSize: 24, color: c.text }}>
        {value}
        <Text style={[T.fine, { color: c.muted }]}> {unit}</Text>
      </Text>
      {status ? <Text style={[T.fine, { color, fontFamily: font.bodySemi }]}>{status}</Text> : null}
    </View>
  );
}

/** The dashboard card: the newest blood pressure and pulse with their status. Opens the vitals page. */
export function VitalsCard({ summary }: { summary?: VitalSummary }) {
  const router = useRouter();
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const colorOf = useCategoryColor();
  const pressure = summary?.latestPressure ?? null;
  const pulse = summary?.latestPulse ?? null;
  // A pulse read on a blood pressure machine has its own category beside the pressure's.
  const pulseCategory = pulse ? (pulse.kind === 'PULSE' ? pulse.category : pulse.pulseCategory) : null;
  const open = () => router.push('/(app)/vitals');

  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={a.vitalsTitle}>
      <Glass style={{ padding: 16, gap: 14 }}>
        {pressure || pulse ? (
          <View style={styles.metrics}>
            <Metric
              label={a.vitalPressure}
              value={pressure ? `${pressure.systolic}/${pressure.diastolic}` : '–'}
              unit="mmHg"
              status={pressure ? categoryText(pressure.category, a) : null}
              color={colorOf(pressure?.category ?? null)}
            />
            <Metric
              label={a.vitalPulse}
              value={pulse?.pulse != null ? String(pulse.pulse) : '–'}
              unit="bpm"
              status={pulseCategory ? categoryText(pulseCategory, a) : null}
              color={colorOf(pulseCategory)}
            />
          </View>
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="heart-pulse" size={22} color={c.danger} />
            <Text style={[T.body, { color: c.muted, flex: 1 }]}>{a.vitalsCardEmpty}</Text>
          </View>
        )}
        <QuietButton label={a.vitalsLogReading} onPress={open} />
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  metrics: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, gap: 2 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
