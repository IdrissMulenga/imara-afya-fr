// components/home/adherence-card.tsx — how much of it you actually took.
//
// THE NUMBER YOU ALREADY HAD AND NEVER SAW.
//
// Every dose has been written to the database since the feature shipped, and
// nothing ever read it back. The log was write-only: people recorded doses and
// the app never once told them what that added up to.
//
// THE DENOMINATOR IS THE POINT. A percentage over "doses you recorded" is
// always 100% and tells nobody anything. This is over doses that were DUE —
// worked out from each medicine's own frequency and course dates on the
// server, which is why an every-other-day tablet doesn't score 50%.
//
// Today is deliberately excluded: a dose due at 20:00 is not missed at 09:00,
// and counting it would show a figure that climbs through the day and means
// nothing before bedtime.
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import type { AdherenceSummary } from '@/graphql';

// Green is "doing well", amber is "worth noticing", and the boundary is not a
// clinical threshold — it is the point where a person deserves a nudge rather
// than a congratulation. Nothing here is red: an adherence figure is a
// prompt, not a telling-off, and red is how a health app becomes one people
// stop opening.
const GOOD_ENOUGH = 80;

export default function AdherenceCard({ summary }: { summary?: AdherenceSummary | null }) {
  const { c, radius } = useTheme();
  const { t } = useStrings();

  // Nothing due in the window — a brand new account, or a course that hasn't
  // started. There is no honest percentage of zero, so the card stays away
  // rather than showing a confident 0%.
  if (!summary || summary.percent == null) return null;

  const good = summary.percent >= GOOD_ENOUGH;
  const tint = good ? '#0F7A54' : '#B45309';

  // which time of day gets missed most — usually the evening one
  const worst = [...summary.bySlot]
    .filter((s) => s.due >= 3)
    .sort((a, b) => (a.taken / a.due) - (b.taken / b.due))[0];

  const worstIsWorthSaying = worst && worst.taken < worst.due;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius + 4 }]}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: good ? '#DCFCE7' : '#FEF3C7' }]}>
          <Ionicons name={good ? 'checkmark-circle' : 'time-outline'} size={19} color={tint} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{t.adherenceTitle}</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>{t.lastDaysShort}</Text>
        </View>

        {summary.streak > 1 && (
          <View style={[styles.streak, { backgroundColor: c.fieldBg }]}>
            <Ionicons name="flame" size={13} color="#F97316" />
            <Text style={[styles.streakText, { color: c.text }]}>{summary.streak}</Text>
          </View>
        )}
      </View>

      <View style={styles.figures}>
        <Text style={[styles.percent, { color: tint }]}>
          {summary.percent}
          <Text style={[styles.percentSign, { color: c.textMuted }]}>%</Text>
        </Text>

        <Text style={[styles.counts, { color: c.textMuted }]}>
          {summary.taken} / {summary.due} {t.dosesTaken}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: c.fieldBg }]}>
        <View style={[styles.fill, { backgroundColor: tint, width: `${summary.percent}%` }]} />
      </View>

      {/* The single most actionable thing in the card. "You miss the evening
          one" is something a person can do something about; a percentage on
          its own is not. Only shown once there is enough of that slot to mean
          anything — three days is not a pattern. */}
      {worstIsWorthSaying && (
        <Text style={[styles.worst, { color: c.textMuted }]}>
          {t.mostMissed}: {worst.slot} ({worst.due - worst.taken}/{worst.due})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  sub: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  streakText: { fontSize: 12.5, fontWeight: '800' },

  figures: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  percent: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  percentSign: { fontSize: 17, fontWeight: '700', letterSpacing: 0 },
  counts: { fontSize: 12.5, fontWeight: '600' },

  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },

  worst: { fontSize: 12.5, fontWeight: '600' },
});
