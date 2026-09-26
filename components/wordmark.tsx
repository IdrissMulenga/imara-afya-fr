// The logo. onDark puts it on a white rounded plate for the welcome screen.
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/theme';
import { font, welcome } from '@/theme/tokens';

const LOGO = require('@/assets/images/imara-afya-logo.png');

/** The Imara Afya name as a logo, with an optional tagline. */
export function Wordmark({ onDark = false, tagline }: { onDark?: boolean; tagline?: string }) {
  const { c } = useTheme();
  const ink = onDark ? welcome.ink : c.text;

  return (
    <View style={styles.row}>
      {onDark ? (
        <View style={styles.plate}>
          <Image source={LOGO} style={{ width: 37, height: 37 }} resizeMode="contain" />
        </View>
      ) : (
        <Image source={LOGO} style={{ width: 30, height: 30 }} resizeMode="contain" />
      )}

      <View style={{ gap: 3 }}>
        <Text style={[styles.name, { color: ink }]}>Imara Afya</Text>
        {tagline ? (
          <Text
            style={[
              styles.tagline,
              { color: onDark ? 'rgba(246,247,249,0.62)' : c.faint },
            ]}
          >
            {tagline}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  plate: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  name: { fontFamily: font.display, fontSize: 19, letterSpacing: -0.2 },
  tagline: {
    fontFamily: font.bodyMedium,
    fontSize: 10.5,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
});
