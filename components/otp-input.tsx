// Six-digit code input: one hidden TextInput drawn as six boxes, so autofill fills the whole code.
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/theme/theme';
import { radius, size, font } from '@/theme/tokens';
import { useBlink, useFade, usePop } from '@/components/motion';

export const CODE_LENGTH = 6;

/** Input for a six-digit code; onFilled runs once every digit is in. */
export function OtpInput({
  value,
  onChange,
  onFilled,
  editable = true,
}: {
  value: string;
  onChange: (next: string) => void;
  onFilled?: (code: string) => void;
  editable?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.padEnd(CODE_LENGTH, ' ').slice(0, CODE_LENGTH).split('');
  const cursor = Math.min(value.length, CODE_LENGTH - 1);

  const handle = (raw: string) => {
    // Strip anything that is not a digit, so a pasted "482 913" still works.
    const clean = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    onChange(clean);
    if (clean.length === CODE_LENGTH) onFilled?.(clean);
  };

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityRole="none" style={styles.row}>
      {digits.map((d, i) => (
        <Box
          key={i}
          digit={d}
          active={editable && focused && i === cursor && value.length < CODE_LENGTH}
        />
      ))}

      <TextInput
        ref={ref}
        value={value}
        onChangeText={handle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={editable}
        keyboardType="number-pad"
        // One-time-code autofill on both platforms.
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        accessibilityLabel="Six digit code"
        style={styles.hidden}
      />
    </Pressable>
  );
}

// One box; a separate component so each has its own animated values.
function Box({ digit, active }: { digit: string; active: boolean }) {
  const { c } = useTheme();
  const filled = digit.trim().length > 0;

  const ring = useFade(active, 140);
  const pop = usePop(filled);
  const caret = useBlink(active);

  return (
    <View style={[styles.box, { backgroundColor: c.field, borderColor: c.border }]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.ring, { borderColor: c.primary, opacity: ring }]}
      />

      <Animated.View style={pop}>
        <Text style={[styles.digit, { color: c.text }]}>{digit}</Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.centre, { opacity: caret }]}
      >
        <View style={[styles.caret, { backgroundColor: c.primary }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 9 },
  box: {
    flex: 1,
    height: size.otpBox,
    borderWidth: 1,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: 2, borderRadius: radius.chip },
  digit: { fontFamily: font.display, fontSize: 24 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  caret: { width: 2, height: 24, borderRadius: 1 },
  // Not display:none, which cannot be focused or autofilled.
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
