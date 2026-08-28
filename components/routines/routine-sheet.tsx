// components/routines/routine-sheet.tsx — add or edit one routine.
//
// Name, which days, and an optional time. Deliberately short: a routine someone
// has to fill in a form to create is a routine they won't create.
import { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';
import type { Routine } from '@/graphql';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// A few sensible icons rather than a full picker — enough to make a list
// scannable, few enough to choose from without thinking.
const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'checkmark-circle-outline',
  'walk-outline',
  'water-outline',
  'nutrition-outline',
  'barbell-outline',
  'book-outline',
  'moon-outline',
  'heart-outline',
];

export default function RoutineSheet({
  visible,
  routine,
  saving,
  onClose,
  onSave,
  onRemove,
}: {
  visible: boolean;
  routine: Routine | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: { title: string; icon: string; days: number[]; time?: string }) => void;
  onRemove: () => void;
}) {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [days, setDays] = useState<number[]>([]);
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  // keyed on the id, not the object: a refetch hands us a new object for the
  // same routine, which would otherwise reset whatever is being typed
  useEffect(() => {
    if (!visible) return;

    setTitle(routine?.title ?? '');
    setIcon(routine?.icon ?? ICONS[0]);
    setDays(routine?.days ?? []);
    setTime(routine?.time ?? '');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, routine?.id]);

  // Monday first — Sunday is 0 in the data but last in most people's week.
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const DAY_LABEL: Record<number, string> = {
    1: t.dayMon, 2: t.dayTue, 3: t.dayWed, 4: t.dayThu, 5: t.dayFri, 6: t.daySat, 0: t.daySun,
  };

  const toggleDay = (day: number) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const submit = () => {
    if (!title.trim()) {
      setError(t.errRoutineName);
      return;
    }

    if (time && !TIME_RE.test(time)) {
      setError(t.errTimeFormat);
      return;
    }

    onSave({
      title: title.trim(),
      icon,
      // An empty array means "every day" to the backend, and selecting all
      // seven means the same thing — so normalise, or the two would produce
      // different-looking data for identical behaviour.
      days: days.length === 7 ? [] : days,
      time: time.trim() || undefined,
    });
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
              <Text style={[styles.title, { color: c.text }]}>
                {routine ? t.editRoutine : t.addRoutine}
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, { color: c.textMuted }]}>{t.routineName}</Text>
              <TextInput
                value={title}
                onChangeText={(v) => { setTitle(v); if (error) setError(null); }}
                placeholder={t.routineNamePh}
                placeholderTextColor={c.textFaint}
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              />

              {/* icon */}
              <View style={styles.iconRow}>
                {ICONS.map((name) => {
                  const on = icon === name;

                  return (
                    <PressableScale
                      key={name}
                      onPress={() => setIcon(name)}
                      style={[
                        styles.iconChip,
                        {
                          backgroundColor: on ? c.primary : c.surface,
                          borderColor: on ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Ionicons name={name} size={19} color={on ? '#fff' : c.textMuted} />
                    </PressableScale>
                  );
                })}
              </View>

              {/* days */}
              <Text style={[styles.label, { color: c.textMuted }]}>{t.routineDays}</Text>
              <View style={styles.dayRow}>
                {DAY_ORDER.map((day) => {
                  // no days selected means every day, so show them all as on
                  const on = days.length === 0 || days.includes(day);

                  return (
                    <PressableScale
                      key={day}
                      onPress={() => {
                        // first tap out of "every day" starts from that one day
                        if (days.length === 0) setDays([day]);
                        else toggleDay(day);
                      }}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: on ? c.primary : c.surface,
                          borderColor: on ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text style={[styles.dayText, { color: on ? '#fff' : c.textMuted }]}>
                        {DAY_LABEL[day]}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              {!days.length && (
                <Text style={[styles.hint, { color: c.textFaint }]}>{t.everyDay}</Text>
              )}

              <Text style={[styles.label, { color: c.textMuted }]}>{t.routineTime}</Text>
              <TextInput
                value={time}
                onChangeText={(v) => { setTime(v); if (error) setError(null); }}
                placeholder={t.timePh}
                placeholderTextColor={c.textFaint}
                keyboardType="numbers-and-punctuation"
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              />

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
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryText}>{t.save}</Text>}
              </PressableScale>

              {!!routine && (
                <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
                  <Ionicons name="trash-outline" size={17} color={c.danger} />
                  <Text style={[styles.removeText, { color: c.danger }]}>{t.remove}</Text>
                </Pressable>
              )}
            </ScrollView>
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
    paddingHorizontal: 22, paddingTop: 10, maxHeight: '88%',
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
    fontSize: 15.5, fontWeight: '600',
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  iconChip: {
    width: 44, height: 44, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1, borderWidth: 1, borderRadius: 11,
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  dayText: { fontSize: 11.5, fontWeight: '700' },
  hint: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  errText: { flex: 1, fontSize: 12.5, fontWeight: '600' },
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
