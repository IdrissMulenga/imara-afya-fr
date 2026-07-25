// components/text-field.tsx — labeled input with icon, focus ring, error, password reveal
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  type KeyboardTypeOptions, type ReturnKeyTypeOptions,
  type NativeSyntheticEvent, type TextInputSubmitEditingEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TextFieldProps = {
  label: string;
  icon?: IoniconName;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  returnKeyType?: ReturnKeyTypeOptions;
};

export default function TextField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  error,
  secure = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  onSubmitEditing,
  returnKeyType,
}: TextFieldProps) {
  const { c, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  // Focus is shown purely via border colour — the border width is constant, so
  // there's no layout shift or background/shadow repaint flash ("blink") on tap.
  const borderColor = error ? c.danger : focused ? c.primary : 'transparent';

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: c.fieldBg,
            borderColor,
            borderRadius: radius,
          },
        ]}
      >
        {icon && <Ionicons name={icon} size={19} color={c.textFaint} style={{ marginLeft: 15 }} />}
        <TextInput
          style={[styles.input, { color: c.text, marginLeft: icon ? 11 : 16 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textFaint}
          secureTextEntry={secure && !reveal}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />
        {secure && (
          <Pressable onPress={() => setReveal((r) => !r)} hitSlop={10} style={{ paddingHorizontal: 16 }}>
            <Ionicons name={reveal ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && (
        <View style={styles.errRow}>
          <Ionicons name="alert-circle" size={14} color={c.danger} />
          <Text style={[styles.errText, { color: c.danger }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 15 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errText: { fontSize: 12.5, fontWeight: '600' },
});
