// app/(home)/records.tsx — health records.
// Backed by myHealthRecords / addHealthRecord / updateHealthRecord / removeHealthRecord.
import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/constants/theme';
import usePullRefresh from '@/hooks/use-pull-refresh';
import { ScreenHeader } from '@/components/hero-backdrop';
import { useTabBarInset } from '@/components/glass-surface';
import { useStrings } from '@/constants/strings';
import useRecords, { RECORD_TYPES, type RecordType } from '@/hooks/use-records';
import useAttachments from '@/hooks/use-attachments';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import RecordRow from '@/components/records/record-row';
import RecordSheet from '@/components/records/record-sheet';
import { FadeIn, PressableScale } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import type { HealthRecord } from '@/graphql';

export default function RecordsScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  // on iOS 26 the tab bar floats over the content as glass, so give that
  // height back as padding. Zero on Android and older iPhones.
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const {
    grouped, count, filter, setFilter,
    add, update, remove, saving, loading, refetch,
  } = useRecords();

  // the spinner shows for a pull, not for every background refetch
  const { refreshing, onRefresh } = usePullRefresh(refetch);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);

  const { attachImage, removeAttachment, busy: attaching, configured } = useAttachments();

  // ATTACH A PHOTO.
  //
  // The mutation returns the whole record, so we replace `editing` with the
  // fresh copy — otherwise the sheet would keep showing the old attachment
  // list until it was closed and reopened.
  const onAttach = async (recordId: string) => {
    if (!configured) {
      toast.error(t.errUploadNotSet);
      return;
    }

    try {
      const updated = await attachImage(recordId);

      // null means she backed out of the picker, which is not an error
      if (!updated) return;

      setEditing(updated);
      toast.success(t.attachmentAdded);
    } catch (err) {
      const message = (err as Error)?.message;

      if (message === 'MEDIA_PERMISSION_DENIED') toast.error(t.errMediaPermission);
      else if (message === 'UPLOAD_NOT_CONFIGURED') toast.error(t.errUploadNotSet);
      else toast.error(errorMessage(err, t.errGeneric));
    }
  };

  const onDetach = (recordId: string, attachmentId: string) => {
    Alert.alert(t.removeAttachmentTitle, '', [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await removeAttachment(recordId, attachmentId);

            if (updated) setEditing(updated);
            toast.success(t.attachmentRemoved);
          } catch (err) {
            toast.error(errorMessage(err, t.errGeneric));
          }
        },
      },
    ]);
  };

  const typeLabel = (value: RecordType) =>
    value === 'Condition' ? t.typeCondition : value === 'Allergy' ? t.typeAllergy : t.typeMedication;

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (record: HealthRecord) => {
    setEditing(record);
    setSheetOpen(true);
  };

  const onSave = async (values: { type: RecordType; name: string; note?: string }) => {
    try {
      if (editing) {
        // the backend only lets name and note change on an existing record
        await update(editing.id, { name: values.name, note: values.note });
      } else {
        await add(values);
      }
      setSheetOpen(false);
      toast.success(t.recordSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  // deleting health information is permanent, so always confirm first
  const onRemove = () => {
    if (!editing) return;

    Alert.alert(t.removeRecordTitle, t.removeRecordBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(editing.id);
            setSheetOpen(false);
            toast.success(t.recordRemoved);
          } catch (err) {
            toast.error(errorMessage(err, t.errGeneric));
          }
        },
      },
    ]);
  };

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <ScreenHeader back title={t.recordsTitle} subtitle={t.recordsSub} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 + tabBarInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >
        {/* ---------------- green hero ---------------- */}

        {/* ---------------- filters ---------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            onPress={() => setFilter(null)}
            style={[
              styles.chip,
              {
                backgroundColor: filter === null ? c.primary : c.surface,
                borderColor: filter === null ? c.primary : c.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: filter === null ? '#fff' : c.textMuted }]}>
              {t.filterAll}
            </Text>
          </Pressable>

          {RECORD_TYPES.map((value) => {
            const on = filter === value;
            return (
              <Pressable
                key={value}
                onPress={() => setFilter(on ? null : value)}
                style={[
                  styles.chip,
                  { backgroundColor: on ? c.primary : c.surface, borderColor: on ? c.primary : c.border },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? '#fff' : c.textMuted }]}>
                  {typeLabel(value)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ---------------- list ---------------- */}
        <View style={styles.body}>
          {loading && !count ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 32 }} />
          ) : !count ? (
            <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="folder-open-outline" size={30} color={c.textFaint} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>{t.noRecords}</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noRecordsSub}</Text>
            </View>
          ) : (
            grouped.map((section, s) => (
              <View key={section.type} style={{ marginBottom: 22 }}>
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>
                  {typeLabel(section.type)}
                </Text>
                <View style={{ gap: 10 }}>
                  {section.items.map((record, i) => (
                    <FadeIn key={record.id} index={s * 2 + i}>
                      <RecordRow
                        name={record.name}
                        note={record.note}
                        type={record.type}
                        attachmentCount={record.attachments?.length ?? 0}
                        onPress={() => openEdit(record)}
                      />
                    </FadeIn>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ---------------- add button ---------------- */}
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
        <Text style={styles.fabText}>{t.addRecord}</Text>
      </PressableScale>

      <RecordSheet
        visible={sheetOpen}
        record={editing}
        saving={saving}
        onClose={() => setSheetOpen(false)}
        onSave={onSave}
        onRemove={onRemove}
        onAttach={onAttach}
        onDetach={onDetach}
        attaching={attaching}
      />
    </SwipeBack>
  );
}

const styles = StyleSheet.create({

  filterRow: { paddingHorizontal: 22, paddingTop: 18, gap: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 13.5, fontWeight: '700' },

  body: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 10,
  },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 40, paddingHorizontal: 26, borderWidth: 1, borderRadius: 20, marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  emptyText: { fontSize: 13.5, fontWeight: '500', textAlign: 'center', lineHeight: 19 },

  fab: {
    position: 'absolute', right: 22,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 15, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
