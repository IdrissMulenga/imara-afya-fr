// app/(home)/records.tsx — health records.
// Backed by myHealthRecords / addHealthRecord / updateHealthRecord / removeHealthRecord.
import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import useRecords, { RECORD_TYPES, type RecordType } from '@/hooks/use-records';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import RecordRow from '@/components/records/record-row';
import RecordSheet from '@/components/records/record-sheet';
import { FadeIn, PressableScale } from '@/components/motion';
import type { HealthRecord } from '@/graphql';

export default function RecordsScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const {
    grouped, count, filter, setFilter,
    add, update, remove, saving, loading, refetch,
  } = useRecords();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);

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
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={c.primary} />
        }
      >
        {/* ---------------- green hero ---------------- */}
        <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 12 }]}>
          <View style={styles.heroTop}>
            {router.canGoBack() && (
              <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </Pressable>
            )}
            <Text style={styles.heroTitle}>{t.recordsTitle}</Text>
          </View>
          <Text style={styles.heroSub}>{t.recordsSub}</Text>
        </View>

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
        style={[styles.fab, { backgroundColor: c.primary, bottom: insets.bottom + 22 }]}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtn: { marginLeft: -6 },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 8 },

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
