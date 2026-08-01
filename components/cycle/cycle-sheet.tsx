// components/cycle/cycle-sheet.tsx — edit or remove one logged period.
//
// Dates are plain YYYY-MM-DD text fields rather than a native picker: no date
// picker package is installed, and adding one is a native rebuild. The backend
// validates the dates anyway, so a typo is caught rather than stored.
import { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';
import { todayIso } from '@/hooks/use-cycle';
import type { PeriodCycle } from '@/graphql';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function CycleSheet({
  visible,
  cycle,
  saving,
  onClose,
  onSave,
  onRemove,
}: {
  visible: boolean;
  cycle: PeriodCycle | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: { startDate: string; endDate?: string }) => void;
  onRemove: () => void;
}) {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // keyed on the id, not the object: a refetch hands us a new object for the
  // same cycle, which would otherwise reset the dates she is editing
  useEffect(() => {
    if (!visible || !cycle) return;
    setStartDate(cycle.startDate);
    setEndDate(cycle.endDate ?? '');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cycle?.id]);

  const submit = () => {
    if (!DATE_RE.test(startDate) || (endDate && !DATE_RE.test(endDate))) {
      setError(t.errDateFormat);
      return;
    }

    onSave({ startDate, endDate: endDate || undefined });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ justifyContent: 'flex-end', flex: 1 }}
        >
          <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.grabber} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: c.text }]}>{t.editCycle}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: c.textMuted }]}>{t.startDateLabel}</Text>
            <TextInput
              value={startDate}
              onChangeText={(v) => {
                setStartDate(v);
                if (error) setError(null);
              }}
              placeholder={t.datePh}
              placeholderTextColor={c.textFaint}
              keyboardType="numbers-and-punctuation"
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
            />

            <Text style={[styles.label, { color: c.textMuted }]}>{t.endDateLabel}</Text>
            <TextInput
              value={endDate}
              onChangeText={(v) => {
                setEndDate(v);
                if (error) setError(null);
              }}
              placeholder={t.stillOngoing}
              placeholderTextColor={c.textFaint}
              keyboardType="numbers-and-punctuation"
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
            />

            {/* one tap to close an ongoing period, instead of typing today's date */}
            {!endDate && (
              <PressableScale
                onPress={() => setEndDate(todayIso())}
                style={[styles.ghost, { borderColor: c.border }]}
              >
                <Ionicons name="checkmark-circle-outline" size={17} color={c.primary} />
                <Text style={[styles.ghostText, { color: c.primary }]}>{t.markFinished}</Text>
              </PressableScale>
            )}

            {!!error && (
              <View style={styles.errRow}>
                <Ionicons name="alert-circle" size={14} color={c.danger} />
                <Text style={[styles.errText, { color: c.danger }]}>{error}</Text>
              </View>
            )}

            <PressableScale
              onPress={submit}
              disabled={saving}
              style={[styles.primary, { backgroundColor: c.primary }]}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t.save}</Text>}
            </PressableScale>

            <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
              <Ionicons name="trash-outline" size={17} color={c.danger} />
              <Text style={[styles.removeText, { color: c.danger }]}>{t.remove}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(120,120,120,0.35)', marginBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15.5, fontWeight: '600', letterSpacing: 0.4,
  },
  ghost: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: 13, paddingVertical: 12, marginTop: 12,
  },
  ghostText: { fontSize: 14, fontWeight: '700' },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  errText: { fontSize: 12.5, fontWeight: '600' },
  primary: {
    marginTop: 20, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
  },
  removeText: { fontSize: 14.5, fontWeight: '700' },
});
