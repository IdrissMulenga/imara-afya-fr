// components/home/check-in-card.tsx — "how are you today?", in two taps.
//
// THE CARD FOR PEOPLE WHO AREN'T ILL.
//
// Everything else on this dashboard assumes something to manage: a medicine, a
// cycle, a condition. Someone perfectly well opens the app, sees nothing that
// applies to them, and stops opening it. Mood and energy apply to everyone, and
// answering takes about four seconds.
//
// It is also the only thing here that gets MORE useful the longer you use it —
// mood against sleep, energy against the cycle, both against whether medicine
// was actually taken. The streak is shown because that is what makes people
// answer on day nine.
import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';

// FIVE FACES, NOT TEN.
//
// Three is too coarse to show a trend and ten asks for a precision nobody has
// about their own mood. The faces are the scale — a row of numbers 1-5 makes
// people think about the number instead of about how they feel.
const FACES: { value: number; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
  { value: 1, icon: 'sad-outline', tint: '#EF4444' },
  { value: 2, icon: 'sad-outline', tint: '#F97316' },
  { value: 3, icon: 'remove-circle-outline', tint: '#EAB308' },
  { value: 4, icon: 'happy-outline', tint: '#84CC16' },
  { value: 5, icon: 'happy-outline', tint: '#16A34A' },
];

export type CheckInCardProps = {
  /** today's entry, if she has already answered */
  mood?: number | null;
  energy?: number | null;
  streak?: number | null;
  busy?: boolean;
  onSave: (mood: number, energy: number) => void;
  onOpen: () => void;
};

export default function CheckInCard({
  mood, energy, streak, busy, onSave, onOpen,
}: CheckInCardProps) {
  const { c, radius } = useTheme();
  const { t } = useStrings();

  const answered = mood != null && energy != null;

  // Held locally so the two taps feel instant on a slow connection. Picking a
  // mood shows the energy question immediately rather than after a round trip.
  const [draftMood, setDraftMood] = useState<number | null>(null);

  const onPickMood = (value: number) => {
    // Already answered today? A tap is a correction, and she still has to
    // confirm the energy — saving mood alone would silently keep yesterday's.
    setDraftMood(value);
  };

  const onPickEnergy = (value: number) => {
    if (draftMood == null) return;

    onSave(draftMood, value);
    setDraftMood(null);
  };

  // ---------------------------------------------------------------- answered
  if (answered && draftMood == null) {
    const face = FACES.find((f) => f.value === mood) ?? FACES[2];

    return (
      <PressableScale
        onPress={onOpen}
        style={[styles.card, styles.done, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius + 4 }]}
      >
        <View style={[styles.doneFace, { backgroundColor: `${face.tint}1A` }]}>
          <Ionicons name={face.icon} size={26} color={face.tint} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.doneTitle, { color: c.text }]}>{t.checkInToday}</Text>
          <Text style={[styles.doneSub, { color: c.textMuted }]} numberOfLines={1}>
            {t.moodLabel} {mood}/5 · {t.energyLabel} {energy}/5
          </Text>
        </View>

        {!!streak && (
          <View style={[styles.streak, { backgroundColor: c.fieldBg }]}>
            <Ionicons name="flame" size={13} color="#F97316" />
            <Text style={[styles.streakText, { color: c.text }]}>{streak}</Text>
          </View>
        )}

        {/* tapping edits it — a bad morning can turn into a fine afternoon */}
        <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
      </PressableScale>
    );
  }

  // ------------------------------------------------------------- not answered
  const askingEnergy = draftMood != null;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius + 4 }]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>
            {askingEnergy ? t.energyQuestion : t.checkInSub}
          </Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>
            {askingEnergy ? t.energyHint : t.moodHint}
          </Text>
        </View>

        {busy && <ActivityIndicator size="small" color={c.primary} />}
      </View>

      <View style={styles.faces}>
        {FACES.map((face) => {
          const active = askingEnergy ? false : draftMood === face.value;

          return (
            <PressableScale
              key={face.value}
              onPress={() => (askingEnergy ? onPickEnergy(face.value) : onPickMood(face.value))}
              disabled={busy}
              style={[
                styles.face,
                {
                  backgroundColor: active ? face.tint : `${face.tint}14`,
                  borderColor: active ? face.tint : 'transparent',
                },
              ]}
            >
              <Ionicons
                name={face.icon}
                size={24}
                color={active ? '#fff' : face.tint}
              />
            </PressableScale>
          );
        })}
      </View>

      {/* a way back, so a mis-tap on the first question isn't a dead end */}
      {askingEnergy && (
        <PressableScale onPress={() => setDraftMood(null)} hitSlop={8} style={styles.back}>
          <Ionicons name="arrow-back" size={13} color={c.textMuted} />
          <Text style={[styles.backText, { color: c.textMuted }]}>{t.back}</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  sub: { fontSize: 12.5, fontWeight: '500', marginTop: 3 },

  faces: { flexDirection: 'row', gap: 8, marginTop: 14 },
  face: {
    flex: 1, height: 52, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },

  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 12.5, fontWeight: '600' },

  done: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doneFace: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  doneSub: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  streakText: { fontSize: 12.5, fontWeight: '800' },
});
