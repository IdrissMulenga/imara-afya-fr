// components/profile/delete-account-sheet.tsx — permanently delete the account.
//
// Deliberately slow. Deleting is irreversible and takes everything with it, so
// the sheet spells out what goes, requires the password, and keeps the
// destructive button visually secondary until the field is filled.
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

export default function DeleteAccountSheet({
  visible,
  deleting,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}) {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');

  // never leave a typed password sitting in state after the sheet closes
  useEffect(() => {
    if (!visible) setPassword('');
  }, [visible]);

  const ready = password.length > 0 && !deleting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ justifyContent: 'flex-end', flex: 1 }}
        >
          <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.grabber} />

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={[styles.warnIcon, { backgroundColor: c.dangerRing }]}>
                  <Ionicons name="warning-outline" size={22} color={c.danger} />
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color={c.textMuted} />
                </Pressable>
              </View>

              <Text style={[styles.title, { color: c.text }]}>{t.deleteAccountTitle}</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>{t.deleteAccountBody}</Text>

              {/* name exactly what is destroyed — vague warnings get ignored */}
              <View style={[styles.list, { backgroundColor: c.surface, borderColor: c.border }]}>
                {[
                  t.deleteItemRecords,
                  t.deleteItemMeds,
                  t.deleteItemCycles,
                  t.deleteItemHabits,
                  t.deleteItemAccount,
                ].map((item) => (
                  <View key={item} style={styles.listRow}>
                    <Ionicons name="close-circle-outline" size={15} color={c.danger} />
                    <Text style={[styles.listText, { color: c.text }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.permanent, { color: c.danger }]}>{t.deleteNoUndo}</Text>

              <Text style={[styles.label, { color: c.textMuted }]}>{t.deleteConfirmPassword}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t.passwordPh}
                placeholderTextColor={c.textFaint}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              />

              {/* keep going the easy choice; deleting takes deliberate effort */}
              <PressableScale
                onPress={onClose}
                style={[styles.keep, { backgroundColor: c.primary }]}
              >
                <Text style={styles.keepText}>{t.deleteKeepAccount}</Text>
              </PressableScale>

              <PressableScale
                onPress={() => onConfirm(password)}
                disabled={!ready}
                style={[
                  styles.delete,
                  { borderColor: c.danger, opacity: ready ? 1 : 0.4 },
                ]}
              >
                {deleting ? (
                  <ActivityIndicator color={c.danger} />
                ) : (
                  <Text style={[styles.deleteText, { color: c.danger }]}>
                    {t.deleteConfirmCta}
                  </Text>
                )}
              </PressableScale>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 10, maxHeight: '90%',
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(120,120,120,0.35)', marginBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  warnIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, marginTop: 14 },
  body: { fontSize: 14, fontWeight: '500', marginTop: 8, lineHeight: 20 },

  list: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 16, gap: 9 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listText: { flex: 1, fontSize: 13.5, fontWeight: '600' },

  permanent: { fontSize: 13, fontWeight: '800', marginTop: 14 },

  label: { fontSize: 13, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontWeight: '500',
  },

  keep: {
    borderRadius: 16, paddingVertical: 16, marginTop: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  keepText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  delete: {
    borderRadius: 16, paddingVertical: 15, marginTop: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteText: { fontSize: 15, fontWeight: '700' },
});
