// app/(home)/medications.tsx — medication list + reminders.
// Backed by myMedications / addMedication / updateMedication / removeMedication
// / markMedicationTaken.
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput, Modal, Alert,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/constants/theme';
import { todayIso } from '@/lib/dates';
import usePullRefresh from '@/hooks/use-pull-refresh';
import { ScreenHeader } from '@/components/hero-backdrop';
import { useTabBarInset } from '@/components/glass-surface';
import { useStrings } from '@/constants/strings';
import useMedications from '@/hooks/use-medications';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import MedicationRow from '@/components/home/medication-row';
import AdherenceCard from '@/components/home/adherence-card';
import { FadeIn, PressableScale } from '@/components/motion';
import type { DueDose, Medication } from '@/graphql';

// "08:00, 20:00" -> ["08:00","20:00"]
const parseTimes = (raw: string) =>
  raw.split(',').map((s) => s.trim()).filter(Boolean);

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function MedicationsScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  // on iOS 26 the tab bar floats over the content as glass, so give that
  // height back as padding. Zero on Android and older iPhones.
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const {
    dueToday, active, paused, dueCount, adherence,
    add, update, remove, setActive, markTaken, unmarkTaken,
    saving, loading, refetch,
  } = useMedications();

  // the spinner shows for a pull, not for every background refetch
  const { refreshing, onRefresh } = usePullRefresh(refetch);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [endDate, setEndDate] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState<string | null>(null);

  // reset the form each time the sheet opens
  useEffect(() => {
    if (!sheetOpen) return;
    setName(editing?.name ?? '');
    setDosage(editing?.dosage ?? '');
    setTimes((editing?.times ?? []).join(', '));
    setFrequency((editing?.frequency as Frequency) ?? 'daily');
    setEndDate(editing?.endDate ?? '');
    setStock(editing?.stock != null ? String(editing.stock) : '');
    setError(null);
  }, [sheetOpen, editing]);

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (medication: Medication) => {
    setEditing(medication);
    setSheetOpen(true);
  };

  // A dose is a medicine AND a time, so the busy key has to be the dose key —
  // otherwise tapping the 08:00 row spins the 20:00 row of the same medicine.
  const onMarkTaken = async (dose: DueDose) => {
    setBusyId(dose.key);
    try {
      if (dose.taken) {
        await unmarkTaken(dose.medicationId, dose.slot);
      } else {
        await markTaken(dose.medicationId, dose.slot);
        toast.success(t.doseLogged);
      }
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    } finally {
      setBusyId(null);
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      setError(t.errMedName);
      return;
    }

    const list = parseTimes(times);

    if (endDate && !DATE_RE.test(endDate)) {
      setError(t.errCourseDate);
      return;
    }

    if (stock.trim() && (!Number.isFinite(Number(stock)) || Number(stock) < 0)) {
      setError(t.errStock);
      return;
    }

    // the backend stores times as plain strings, so validate the shape here —
    // a bad time would silently never remind her
    if (list.some((time) => !TIME_RE.test(time))) {
      setError(t.errTimeFormat);
      return;
    }

    const input = {
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      times: list,
      frequency,
      // A COURSE ONLY EXISTS IF THERE IS AN END TO IT. The start is today
      // for a new medicine, because "alternate days" has to count from
      // somewhere and a course with no anchor drifts.
      ...(endDate ? { endDate, startDate: editing?.startDate ?? todayIso() } : {}),
      ...(stock.trim() ? { stock: Number(stock) } : {}),
    };

    try {
      if (editing) {
        await update(editing.id, input);
      } else {
        await add(input);
      }
      setSheetOpen(false);
      toast.success(t.medSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  const onRemove = () => {
    if (!editing) return;

    Alert.alert(t.removeMedTitle, t.removeMedBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(editing.id);
            setSheetOpen(false);
            toast.success(t.medRemoved);
          } catch (err) {
            toast.error(errorMessage(err, t.errGeneric));
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <ScreenHeader
        title={t.medsTitle}
        subtitle={dueCount ? `${dueCount} ${t.dueToday}` : t.allDone}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 + tabBarInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >

        <View style={styles.body}>
          {/* WHAT THE DOSE LOG ADDS UP TO. Hides itself when nothing has been
              due yet, rather than showing a new user a confident 0%. */}
          <AdherenceCard summary={adherence} />

          {loading && !dueToday.length ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 32 }} />
          ) : !dueToday.length && !paused.length ? (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="medkit-outline" size={30} color={c.textFaint} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noMedications}</Text>
            </View>
          ) : (
            <>
              {!!dueToday.length && (
                <>
                  <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.activeMeds}</Text>
                  <View style={{ gap: 10 }}>
                    {dueToday.map((dose, i) => (
                      <FadeIn key={dose.key} index={i} style={styles.rowWrap}>
                        <View style={{ flex: 1 }}>
                          <MedicationRow
                            name={dose.name}
                            dosage={dose.dosage}
                            slot={dose.slot}
                            taken={dose.taken}
                            status={dose.status}
                            busy={busyId === dose.key}
                            onMarkTaken={() => onMarkTaken(dose)}
                          />
                        </View>
                        {/* a dose row carries only what a dose needs, so the
                            edit sheet looks the full medicine back up by id */}
                        <PressableScale
                          onPress={() => {
                            const medication = active.find((m) => m.id === dose.medicationId);
                            if (medication) openEdit(medication);
                          }}
                          hitSlop={8}
                          style={styles.editBtn}
                        >
                          <Ionicons name="ellipsis-vertical" size={17} color={c.textFaint} />
                        </PressableScale>
                      </FadeIn>
                    ))}
                  </View>
                </>
              )}

              {!!paused.length && (
                <>
                  <Text style={[styles.sectionTitle, { color: c.textMuted, marginTop: 26 }]}>
                    {t.pausedMeds}
                  </Text>
                  <View style={{ gap: 10 }}>
                    {paused.map((m, i) => (
                      <FadeIn key={m.id} index={i}>
                        <PressableScale
                          onPress={() => openEdit(m)}
                          style={[styles.pausedRow, { backgroundColor: c.surface, borderColor: c.border }]}
                        >
                          <Ionicons name="pause-circle-outline" size={20} color={c.textFaint} />
                          <Text style={[styles.pausedName, { color: c.textMuted }]} numberOfLines={1}>
                            {m.name}
                          </Text>
                          <PressableScale onPress={() => setActive(m.id, true)} hitSlop={8}>
                            <Text style={[styles.resume, { color: c.primary }]}>{t.resume}</Text>
                          </PressableScale>
                        </PressableScale>
                      </FadeIn>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <PressableScale
        onPress={openNew}
        style={[
          styles.fab,
          {
            backgroundColor: c.primary,
            // clear the tab bar as well as the home indicator. tabBarInset is
            // the bar's height when it floats over the content (iOS 26 glass)
            // and 0 otherwise, so this is unchanged everywhere else.
            bottom: insets.bottom + 22 + tabBarInset,
          },
        ]}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabText}>{t.addMedication}</Text>
      </PressableScale>

      {/* ---------------- add / edit sheet ---------------- */}
      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ justifyContent: 'flex-end', flex: 1 }}
          >
            <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + 18 }]}>
              <View style={styles.grabber} />

              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: c.text }]}>
                  {editing ? t.editMedication : t.newMedication}
                </Text>
                <Pressable onPress={() => setSheetOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={22} color={c.textMuted} />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={[styles.label, { color: c.textMuted }]}>{t.medNameLabel}</Text>
                <TextInput
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    if (error) setError(null);
                  }}
                  placeholder={t.medNamePh}
                  placeholderTextColor={c.textFaint}
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                />

                <Text style={[styles.label, { color: c.textMuted }]}>{t.dosageLabel}</Text>
                <TextInput
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder={t.dosagePh}
                  placeholderTextColor={c.textFaint}
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                />

                <Text style={[styles.label, { color: c.textMuted }]}>{t.timesLabel}</Text>
                <TextInput
                  value={times}
                  onChangeText={(v) => {
                    setTimes(v);
                    if (error) setError(null);
                  }}
                  placeholder={t.timesPh}
                  placeholderTextColor={c.textFaint}
                  keyboardType="numbers-and-punctuation"
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                />
                <Text style={[styles.hint, { color: c.textFaint }]}>{t.timesHint}</Text>

                {/* HOW OFTEN. This field has been on the model since the
                    beginning and nothing ever read it, so every medicine was
                    treated as daily — someone on an every-other-day tablet was
                    reminded twice as often as they should be, and their
                    adherence read as half what it actually was. */}
                <Text style={[styles.label, { color: c.textMuted }]}>{t.frequencyLabel}</Text>
                <View style={styles.segment}>
                  {(['daily', 'alternate'] as const).map((option) => {
                    const active = frequency === option;

                    return (
                      <PressableScale
                        key={option}
                        onPress={() => setFrequency(option)}
                        style={[
                          styles.segmentItem,
                          {
                            backgroundColor: active ? c.primary : c.fieldBg,
                            borderColor: active ? c.primary : c.border,
                          },
                        ]}
                      >
                        <Text style={[styles.segmentText, { color: active ? '#fff' : c.textMuted }]}>
                          {option === 'daily' ? t.freqDaily : t.freqAlternate}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>

                {/* THE COURSE. A week of antibiotics is not a permanent
                    prescription — without an end date the reminders never stop
                    and the only way out is deleting the medicine, which takes
                    its dose history with it. Optional, because most medicines
                    genuinely are ongoing. */}
                <Text style={[styles.label, { color: c.textMuted }]}>{t.courseEndLabel}</Text>
                <TextInput
                  value={endDate}
                  onChangeText={(v) => { setEndDate(v); if (error) setError(null); }}
                  placeholder={t.courseEndPh}
                  placeholderTextColor={c.textFaint}
                  keyboardType="numbers-and-punctuation"
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                />

                {/* STOCK, also optional. Plenty of people won't count, and a
                    required field they don't want to fill is a field that makes
                    them abandon the form. */}
                <Text style={[styles.label, { color: c.textMuted }]}>{t.stockLabel}</Text>
                <TextInput
                  value={stock}
                  onChangeText={(v) => { setStock(v); if (error) setError(null); }}
                  placeholder={t.stockPh}
                  placeholderTextColor={c.textFaint}
                  keyboardType="number-pad"
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
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t.save}</Text>}
                </PressableScale>

                {!!editing && (
                  <View style={styles.sheetActions}>
                    <Pressable
                      onPress={() => {
                        setActive(editing.id, !editing.active);
                        setSheetOpen(false);
                      }}
                      hitSlop={8}
                      style={styles.sheetAction}
                    >
                      <Ionicons
                        name={editing.active ? 'pause-outline' : 'play-outline'}
                        size={17}
                        color={c.textMuted}
                      />
                      <Text style={[styles.sheetActionText, { color: c.textMuted }]}>
                        {editing.active ? t.pause : t.resume}
                      </Text>
                    </Pressable>

                    <Pressable onPress={onRemove} hitSlop={8} style={styles.sheetAction}>
                      <Ionicons name="trash-outline" size={17} color={c.danger} />
                      <Text style={[styles.sheetActionText, { color: c.danger }]}>{t.remove}</Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Frequency = 'daily' | 'alternate' | 'specificDays';

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 10, marginTop: 2 },
  segmentItem: {
    flex: 1, borderWidth: 1, borderRadius: 13,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '700' },


  body: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 10,
  },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtn: { paddingHorizontal: 2, paddingVertical: 10 },

  pausedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderWidth: 1, borderRadius: 16,
  },
  pausedName: { flex: 1, fontSize: 15, fontWeight: '600' },
  resume: { fontSize: 13.5, fontWeight: '700' },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 40, borderWidth: 1, borderRadius: 20, marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },

  fab: {
    position: 'absolute', right: 22,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 15, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 10, maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(120,120,120,0.35)', marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontWeight: '500',
  },
  hint: { fontSize: 12, fontWeight: '500', marginTop: 6 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  errText: { fontSize: 12.5, fontWeight: '600' },
  primary: {
    marginTop: 24, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
  sheetAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sheetActionText: { fontSize: 14.5, fontWeight: '700' },
});
