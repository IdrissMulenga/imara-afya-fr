// components/language-picker.tsx — full-name language list for use inside the
// app, where there's room for more than the EN/SW/FR/RN pills in the auth hero.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings, LANGS } from '@/constants/strings';

export default function LanguagePicker({ onChange }: { onChange?: (code: string) => void }) {
  const { c } = useTheme();
  const { lang, setLang } = useStrings();

  return (
    <View style={{ gap: 8 }}>
      {LANGS.map(({ code, label, name }) => {
        const active = lang === code;

        return (
          <Pressable
            key={code}
            onPress={() => {
              // the whole app re-renders from context, no reload needed
              setLang(code);
              onChange?.(code);
            }}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: c.surface,
                borderColor: active ? c.primary : c.border,
                borderWidth: active ? 1.6 : 1,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={[styles.code, { backgroundColor: active ? c.primary : c.fieldBg }]}>
              <Text style={[styles.codeText, { color: active ? '#fff' : c.textMuted }]}>
                {label}
              </Text>
            </View>

            <Text style={[styles.name, { color: c.text }]}>{name}</Text>

            {active && <Ionicons name="checkmark-circle" size={21} color={c.primary} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13, borderRadius: 16,
  },
  code: {
    width: 42, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  codeText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.4 },
  name: { flex: 1, fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
});
