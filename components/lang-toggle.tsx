// components/lang-toggle.tsx — segmented language switcher
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useStrings, LANGS } from '@/constants/strings';

// `hero` => white-glass styling for use on the colored hero.
export default function LangToggle({ hero = false }: { hero?: boolean }) {
  const { c } = useTheme();
  const { lang, setLang } = useStrings();

  const trackBg = hero ? 'rgba(255,255,255,0.16)' : c.fieldBg;

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {LANGS.map(({ code, label }) => {
        const active = lang === code;
        const pillBg = active ? (hero ? '#fff' : c.surface) : 'transparent';
        const fg = active
          ? hero
            ? '#11241d'
            : c.text
          : hero
          ? 'rgba(255,255,255,0.82)'
          : c.textMuted;
        return (
          <Pressable
            key={code}
            onPress={() => setLang(code)}
            style={[styles.pill, { backgroundColor: pillBg }, active && styles.pillActive]}
          >
            <Text style={[styles.label, { color: fg }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: 999, gap: 2 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pillActive: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});
