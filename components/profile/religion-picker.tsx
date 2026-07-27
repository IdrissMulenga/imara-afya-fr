// components/profile/religion-picker.tsx — select + bottom-sheet list of religions.
//
// IMPORTANT: the value stored/sent is a canonical key (e.g. "islam"), never the
// translated label — otherwise a Swahili user would send "Uislamu" and the
// backend enum would reject it. Labels come from the current language, and the
// key order below must match the `religions` arrays in constants/strings.tsx.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';

// must stay in sync with the backend User.religion enum
export const RELIGION_KEYS = [
  'christianity',
  'islam',
  'hinduism',
  'buddhism',
  'traditional',
  'none',
  'prefer_not_to_say',
] as const;

export type ReligionKey = (typeof RELIGION_KEYS)[number];

export default function ReligionPicker({
  value,
  onChange,
}: {
  /** canonical key, e.g. "islam" */
  value: string;
  onChange: (key: string) => void;
}) {
  const { c, radius } = useTheme();
  const { t } = useStrings();
  const [open, setOpen] = useState(false);

  // show the translated label for the currently selected key
  const selectedIndex = RELIGION_KEYS.indexOf(value as ReligionKey);
  const selectedLabel = selectedIndex >= 0 ? t.religions[selectedIndex] : '';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.select, { backgroundColor: c.fieldBg, borderRadius: radius }]}
      >
        <Ionicons name="book-outline" size={19} color={c.textFaint} style={{ marginLeft: 15 }} />
        <Text style={[styles.value, { color: selectedLabel ? c.text : c.textFaint }]} numberOfLines={1}>
          {selectedLabel || t.religionPh}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.textMuted} style={{ marginRight: 16 }} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.surface }]}>
            <View style={[styles.grabber, { backgroundColor: c.borderStrong }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>{t.religionLabel}</Text>

            {RELIGION_KEYS.map((key, i) => {
              const label = t.religions[i] ?? key;
              const on = value === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  style={[styles.item, on && { backgroundColor: c.ring }]}
                >
                  <Text style={[styles.itemText, { color: on ? c.primary : c.text }]}>{label}</Text>
                  {on && <Ionicons name="checkmark" size={18} color={c.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  select: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  value: { flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 11 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 34 },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 12 },
  sheetTitle: { fontSize: 13, fontWeight: '700', marginLeft: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  itemText: { fontSize: 16, fontWeight: '600' },
});
