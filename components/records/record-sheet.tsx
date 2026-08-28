// components/records/record-sheet.tsx — add / edit a health record.
// Modal sheet so the user never loses their place in the list.
import { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/constants/theme';
import { PressableScale } from '@/components/motion';
import { useStrings } from '@/constants/strings';
import { RECORD_TYPES, type RecordType } from '@/hooks/use-records';
import type { HealthRecord } from '@/graphql';

export default function RecordSheet({
  visible,
  record,
  saving,
  onClose,
  onSave,
  onRemove,
  onAttach,
  onDetach,
  attaching,
}: {
  visible: boolean;
  // null = adding a new one, otherwise editing this record
  record: HealthRecord | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: { type: RecordType; name: string; note?: string }) => void;
  onRemove?: () => void;
  // attaching needs a saved record, so these are only wired when editing
  onAttach?: (recordId: string) => void;
  onDetach?: (recordId: string, attachmentId: string) => void;
  attaching?: boolean;
}) {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<RecordType>('Condition');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!record;

  // reset the form each time the sheet opens, keyed on the record id rather
  // than the object — a refetch produces a new object for the same record and
  // would otherwise wipe what she is typing
  useEffect(() => {
    if (!visible) return;
    setType((record?.type as RecordType) ?? 'Condition');
    setName(record?.name ?? '');
    setNote(record?.note ?? '');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, record?.id]);

  const typeLabel = (value: RecordType) =>
    value === 'Condition' ? t.typeCondition : value === 'Allergy' ? t.typeAllergy : t.typeMedication;

  const submit = () => {
    if (!name.trim()) {
      setError(t.errRecordName);
      return;
    }
    onSave({ type, name: name.trim(), note: note.trim() || undefined });
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
                {isEditing ? t.editRecord : t.newRecord}
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* type — locked while editing, the backend only updates name / note */}
              {!isEditing && (
                <>
                  <Text style={[styles.label, { color: c.textMuted }]}>{t.recordTypeLabel}</Text>
                  <View style={styles.typeRow}>
                    {RECORD_TYPES.map((value) => {
                      const on = value === type;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => setType(value)}
                          style={[
                            styles.typeChip,
                            {
                              backgroundColor: on ? c.primary : c.surface,
                              borderColor: on ? c.primary : c.border,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.typeText, { color: on ? '#fff' : c.textMuted }]}
                          >
                            {typeLabel(value)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={[styles.label, { color: c.textMuted }]}>{t.recordNameLabel}</Text>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (error) setError(null);
                }}
                placeholder={t.recordNamePh}
                placeholderTextColor={c.textFaint}
                style={[
                  styles.input,
                  { backgroundColor: c.surface, borderColor: error ? c.danger : c.border, color: c.text },
                ]}
              />
              {!!error && (
                <View style={styles.errRow}>
                  <Ionicons name="alert-circle" size={14} color={c.danger} />
                  <Text style={[styles.errText, { color: c.danger }]}>{error}</Text>
                </View>
              )}

              <Text style={[styles.label, { color: c.textMuted }]}>{t.recordNoteLabel}</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t.recordNotePh}
                placeholderTextColor={c.textFaint}
                multiline
                style={[
                  styles.input,
                  styles.textarea,
                  { backgroundColor: c.surface, borderColor: c.border, color: c.text },
                ]}
              />

              {/* ATTACHMENTS — only when editing.
                  A new record has no id yet, and the backend attaches by
                  record id, so there is nothing to attach a photo to until it
                  has been saved once. */}
              {isEditing && record && (
                <>
                  <View style={styles.attachHead}>
                    <Text style={[styles.label, { color: c.textMuted, marginTop: 0 }]}>
                      {t.attachments}
                    </Text>

                    <PressableScale
                      onPress={() => onAttach?.(record.id)}
                      disabled={attaching}
                      hitSlop={8}
                      style={styles.attachBtn}
                    >
                      {attaching ? (
                        <ActivityIndicator size="small" color={c.primary} />
                      ) : (
                        <>
                          <Ionicons name="add" size={16} color={c.primary} />
                          <Text style={[styles.attachBtnText, { color: c.primary }]}>
                            {t.addAttachment}
                          </Text>
                        </>
                      )}
                    </PressableScale>
                  </View>

                  {!record.attachments?.length ? (
                    <Text style={[styles.attachEmpty, { color: c.textFaint }]}>—</Text>
                  ) : (
                    <View style={styles.attachRow}>
                      {record.attachments.map((file) => (
                        <View key={file.id} style={styles.thumbWrap}>
                          <Image
                            source={{ uri: file.url }}
                            style={[styles.thumb, { borderColor: c.border }]}
                            contentFit="cover"
                            // a health photo is worth a moment of patience, but
                            // not a blank square while it loads
                            transition={150}
                          />

                          <PressableScale
                            onPress={() => onDetach?.(record.id, file.id)}
                            hitSlop={8}
                            style={[styles.thumbRemove, { backgroundColor: c.danger }]}
                          >
                            <Ionicons name="close" size={12} color="#fff" />
                          </PressableScale>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              <PressableScale
                onPress={submit}
                disabled={saving}
                style={[styles.primary, { backgroundColor: c.primary }]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>{t.save}</Text>
                )}
              </PressableScale>

              {isEditing && !!onRemove && (
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
  attachHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, marginBottom: 8,
  },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  attachBtnText: { fontSize: 13.5, fontWeight: '700' },
  attachEmpty: { fontSize: 13, fontWeight: '600' },
  attachRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: { width: 72, height: 72 },
  thumb: { width: 72, height: 72, borderRadius: 12, borderWidth: 1 },
  thumbRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(120,120,120,0.35)', marginBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  typeText: { fontSize: 13.5, fontWeight: '700' },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontWeight: '500',
  },
  textarea: { minHeight: 92, textAlignVertical: 'top' },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  errText: { fontSize: 12.5, fontWeight: '600' },
  primary: {
    marginTop: 24, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 16,
  },
  removeText: { fontSize: 14.5, fontWeight: '700' },
});
