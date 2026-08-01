// components/logo.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';

type LogoProps = {
  size?: number;
  withText?: boolean;
  light?: boolean;
  chip?: boolean;
};

// `chip` wraps the logo in a white app-icon tile (use on colored/dark backgrounds).
export default function Logo({ size = 40, withText = true, light = false, chip = false }: LogoProps) {
  const { c } = useTheme();

  const mark = chip ? (
    <View
      style={[
        styles.chip,
        { width: size * 1.34, height: size * 1.34, borderRadius: size * 0.34 },
      ]}
    >
      <Image
        source={require('../assets/logo.png')}
        style={{ width: size * 0.92, height: size * 0.92, resizeMode: 'contain' }}
      />
    </View>
  ) : (
    <Image
      source={require('../assets/logo.png')}
      style={{ width: size, height: size, resizeMode: 'contain' }}
    />
  );

  return (
    <View style={[styles.row, { gap: size * 0.32 }]}>
      {mark}
      {withText && (
        <Text style={[styles.word, { fontSize: size * 0.46, color: light ? '#fff' : c.text }]}>
          imara
          <Text style={{ color: light ? 'rgba(255,255,255,0.82)' : c.primary }}> afya</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { fontWeight: '800', letterSpacing: -0.4 },
  chip: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
