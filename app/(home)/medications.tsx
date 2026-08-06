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
import { useStrings } from '@/constants/strings';
import useMedications from '@/hooks/use-medications';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import MedicationRow from '@/components/home/medication-row';
import { FadeIn, PressableScale } from '@/components/motion';
import type { Medication } from '@/graphql';

// "08:00, 20:00" -> ["08:00","20:00"]
const parseTimes = (raw: string) =>
  raw.split(',').map((s) => s.trim()).filter(Boolean);

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function MedicationsScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const {
    dueToday, paused, dueCount, add, update, remove, setActive, markTaken,
    saving, loading, refetch,
  } = useMedications();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // reset the form each time the sheet opens
  useEffect(() => {
    if (!sheetOpen) return;
    setName(editing?.name ?? '');
    setDosage(editing?.dosage ?? '');
    setTimes((editing?.times ?? []).join(', '));
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

  const onMarkTaken = async (id: string) => {
    setBusyId(id);
    try {
      await markTaken(id);
      toast.success(t.doseLogged);
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

      {/* fixed header — stays put while the body scrolls */}
      <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroTitle}>{t.medsTitle}</Text>
        <Text style={styles.heroSub}>
          {dueCount ? `${dueCount} ${t.dueToday}` : t.allDone}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={c.primary} />
        }
      >

        <View style={styles.body}>
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
                    {dueToday.map((m, i) => (
                      <FadeIn key={m.id} index={i} style={styles.rowWrap}>
                        <View style={{ flex: 1 }}>
                          <MedicationRow
                            name={m.name}
                            dosage={m.dosage}
                            times={m.times}
                            taken={m.taken}
                            busy={busyId === m.id}
                            onMarkTaken={() => onMarkTaken(m.id)}
                          />
                        </View>
                        <PressableScale onPress={() => openEdit(m)} hitSlop={8} style={styles.editBtn}>
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
        style={[styles.fab, { backgroundColor: c.primary, bottom: insets.bottom + 22 }]}
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

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22, paddingBottom: 26,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', marginTop: 6 },

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
