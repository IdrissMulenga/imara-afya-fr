// components/cycle/regularity-card.tsx — "is your cycle predictable?"
//
// Asked once. Her answer outranks our arithmetic: a woman knows whether her
// period turns up when expected, and we shouldn't show her a confident
// countdown she has already told us not to trust.
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';

export default function RegularityCard({
  onAnswer,
}: {
  onAnswer: (value: 'regular' | 'irregular' | 'unknown') => void;
}) {
  const { c } = useTheme();
  const { t } = useStrings();

  const options: { value: 'regular' | 'irregular' | 'unknown'; label: string; hint: string }[] = [
    { value: 'regular', label: t.regularityRegular, hint: t.regularityRegularHint },
    { value: 'irregular', label: t.regularityIrregular, hint: t.regularityIrregularHint },
    { value: 'unknown', label: t.regularityUnsure, hint: t.regularityUnsureHint },
  ];

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.head}>
        <Ionicons name="help-circle-outline" size={19} color={c.primary} />
        <Text style={[styles.title, { color: c.text }]}>{t.regularityQuestion}</Text>
      </View>

      <Text style={[styles.sub, { color: c.textMuted }]}>{t.regularitySub}</Text>

      <View style={{ gap: 8, marginTop: 14 }}>
        {options.map((option) => (
          <PressableScale
            key={option.value}
            onPress={() => onAnswer(option.value)}
            style={[styles.option, { backgroundColor: c.fieldBg, borderColor: c.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: c.text }]}>{option.label}</Text>
              <Text style={[styles.optionHint, { color: c.textMuted }]}>{option.hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  sub: { fontSize: 13, fontWeight: '500', marginTop: 8, lineHeight: 18 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  optionLabel: { fontSize: 14.5, fontWeight: '700' },
  optionHint: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});
