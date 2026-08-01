// components/profile/number-field.tsx — numeric input used for height / weight
// (both Float on the backend). Keeps the value as a string; the screen converts.
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

import { useTheme } from '@/constants/theme';

export default function NumberField({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const { c, radius } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ flex: 1, gap: 7 }}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.wrap,
          { backgroundColor: c.fieldBg, borderRadius: radius, borderColor: focused ? c.primary : 'transparent' },
        ]}
      >
        <TextInput
          style={[styles.input, { color: c.text }]}
          value={value}
          // digits and a single decimal point only
          onChangeText={(v) => onChangeText(v.replace(/[^0-9.]/g, ''))}
          placeholder={placeholder}
          placeholderTextColor={c.textFaint}
          keyboardType="numeric"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, minHeight: 52 },
  input: { flex: 1, fontSize: 16, fontWeight: '500', paddingHorizontal: 15, paddingVertical: 14 },
});
