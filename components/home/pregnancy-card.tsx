// components/home/pregnancy-card.tsx — how far along, on the home screen.
//
// Shown only while a pregnancy is ACTIVE. This was buried two taps deep under
// More, which is the wrong place for the single most relevant fact in someone's
// week — if she is pregnant, this is the first thing she wants to see.
//
// Deliberately warm rather than clinical, and deliberately quiet about risk:
// the app reports the arithmetic it was given and does not interpret it. A
// countdown is not a medical opinion, and this card must never read like one.
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';

const FULL_TERM_WEEKS = 40;

// EVERY FIGURE IS NULLABLE, because the backend computes them from the last
// period date and returns nulls when there is no active pregnancy to compute
// from. The card is only rendered when `active` is true, but typing these as
// required would push a non-null assertion onto the caller — and the day the
// backend returns a null anyway, that assertion is a crash rather than a zero.
export default function PregnancyCard({
  weeksPregnant, daysIntoWeek, trimester, daysUntilDue, overdue, onPress,
}: {
  weeksPregnant?: number | null;
  daysIntoWeek?: number | null;
  trimester?: number | null;
  daysUntilDue?: number | null;
  overdue?: boolean | null;
  onPress: () => void;
}) {
  const { c, radius } = useTheme();
  const { t } = useStrings();

  const weeks = weeksPregnant ?? 0;
  const intoWeek = daysIntoWeek ?? 0;
  const toGo = daysUntilDue ?? 0;

  const progress = Math.min(Math.max(weeks / FULL_TERM_WEEKS, 0), 1);

  // "Trimester 2" rather than three separate translated names — the ordinal
  // carries the meaning in all four languages and is one string to maintain.
  const trimesterLabel = `${t.trimesterLabel} ${trimester ?? 1}`;

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.card, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8', borderRadius: radius + 4 }]}
    >
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="heart" size={19} color="#DB2777" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t.pregnancyTitle}</Text>
          <Text style={styles.sub}>{trimesterLabel}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#F9A8D4" />
      </View>

      <View style={styles.figures}>
        <View>
          <Text style={styles.big}>
            {weeks}
            <Text style={styles.bigUnit}> {t.weeksPregnant}</Text>
            {intoWeek > 0 && (
              <Text style={styles.bigUnit}> {intoWeek}{t.dayShort}</Text>
            )}
          </Text>
          <Text style={styles.caption}>{t.trimesterLabel}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.big}>
            {/* past the due date the countdown would go negative, which is
                both wrong-looking and unkind on a day already full of waiting */}
            {overdue ? Math.abs(toGo) : Math.max(toGo, 0)}
            <Text style={styles.bigUnit}> {t.daysShort}</Text>
          </Text>
          <Text style={styles.caption}>{overdue ? t.overdueLabel : t.daysToGo}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      {/* the app is not a midwife, and says so where it matters most */}
      <Text style={styles.note}>{t.pregnancyDisclaimer}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#FCE7F3', alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#831843', fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  sub: { color: '#BE185D', fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  figures: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  big: { color: '#831843', fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  bigUnit: { fontSize: 13.5, fontWeight: '700', letterSpacing: 0 },
  caption: { color: '#BE185D', fontSize: 11.5, fontWeight: '600', marginTop: 2 },

  track: { height: 7, borderRadius: 4, backgroundColor: '#FBCFE8', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#DB2777' },

  note: { color: '#BE185D', fontSize: 11, fontWeight: '500', opacity: 0.85, lineHeight: 15 },
});
