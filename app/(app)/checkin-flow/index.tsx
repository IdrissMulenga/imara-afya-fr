// Step-by-step check-in like Apple Health's State of Mind: mood, energy, then a note.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Field } from '@/components/ui';
import { FadeIn } from '@/components/motion';
import { MoodBlob } from '@/components/mood-blob';
import { ScoreSlider } from '@/components/score-slider';
import { EnergyBattery, MoodFace, SCORE_TONES, scoreTone } from '@/components/mood-art';
import { useNotice } from '@/components/notice';
import { useLogCheckIn } from '@/components/checkin';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { CHECK_IN_LIMITS } from '@/graphql/checkin';

type Step = 'mood' | 'energy' | 'note';
const STEPS: Step[] = ['mood', 'energy', 'note'];
const SCORES = [1, 2, 3, 4, 5];
const TONES = [...SCORE_TONES];

export default function CheckInFlow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const a = APP_COPY[lang];
  const notice = useNotice();
  const { save, saving } = useLogCheckIn();

  const [step, setStep] = useState<Step>('mood');
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const moodValue = useSharedValue(3);
  const energyValue = useSharedValue(3);

  const index = STEPS.indexOf(step);
  const scoring = step !== 'note';
  const value = step === 'energy' ? energyValue : moodValue;
  const score = step === 'energy' ? energy : mood;
  const tone = scoreTone(score);

  // A wash of the current colour behind everything.
  const wash = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(value.value, SCORES, TONES),
  }), [value]);

  // Opened from a notification there may be nothing to go back to.
  const close = () => (router.canGoBack() ? router.back() : router.replace('/checkin'));
  const back = () => (index === 0 ? close() : setStep(STEPS[index - 1]));
  const next = () => {
    Haptics.selectionAsync().catch(() => {});
    setStep(STEPS[index + 1]);
  };
  const submit = () => {
    save({ mood, energy, note: note.trim() })
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        notice.success(a.checkInSaved);
        close();
      })
      .catch((e: unknown) => notice.failure(a.checkInLabel, errorMessage(e, lang)));
  };

  const title = step === 'mood' ? a.flowMoodTitle : step === 'energy' ? a.flowEnergyTitle : a.flowNoteTitle;
  const words = step === 'energy' ? a.energyWords : a.moodWords;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wash, wash]} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <RoundButton icon="chevron-left" label={t.back} onPress={back} />
        <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <Text style={[T.body, { color: c.text, fontFamily: font.bodySemi }]}>{a.checkInLabel}</Text>
          <View style={styles.dots}>
            {STEPS.map((s, i) => (
              <View
                key={s}
                style={[styles.dot, { backgroundColor: i <= index ? c.text : c.border, width: i === index ? 18 : 6 }]}
              />
            ))}
          </View>
        </View>
        <RoundButton icon="close" label={a.cancel} onPress={close} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!scoring}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn key={step}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        </FadeIn>

        {scoring ? (
          <>
            <View style={styles.blob}>
              <MoodBlob value={value} size={260} />
            </View>
            <Text style={[styles.word, { color: c.text }]}>{words[score - 1]}</Text>
            <ScoreSlider
              key={step}
              kind={step === 'energy' ? 'energy' : 'mood'}
              value={value}
              score={score}
              onScore={step === 'energy' ? setEnergy : setMood}
              lowLabel={words[0]}
              highLabel={words[4]}
              accessibilityLabel={step === 'energy' ? a.energyName : a.moodName}
            />
          </>
        ) : (
          <FadeIn>
            <View style={styles.summary}>
              <MoodFace score={mood} size={72} />
              <EnergyBattery score={energy} size={64} />
            </View>
            <Text style={[T.body, { color: scoreTone(mood), textAlign: 'center', fontFamily: font.bodySemi }]}>
              {a.moodWords[mood - 1]} · <Text style={{ color: scoreTone(energy) }}>{a.energyWords[energy - 1]}</Text>
            </Text>
            <View style={{ height: 22 }} />
            <Field
              label={a.checkInNote}
              value={note}
              onChangeText={setNote}
              placeholder={a.checkInNotePlaceholder}
              maxLength={CHECK_IN_LIMITS.note}
              multiline
              textAlignVertical="top"
              style={styles.note}
            />
          </FadeIn>
        )}

        <View style={{ flex: 1, minHeight: 24 }} />
        <Pressable
          onPress={scoring ? next : submit}
          disabled={saving}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.next,
            { backgroundColor: scoring ? tone : scoreTone(mood), opacity: saving ? 0.6 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[T.button, { color: '#FFFFFF' }]}>
            {scoring ? t.continue : saving ? a.saving : a.checkInSave}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={c.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wash: { opacity: 0.12 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28 },
  title: { fontFamily: font.displayBold, fontSize: 30, lineHeight: 38, textAlign: 'center' },
  blob: { alignItems: 'center', marginVertical: 18 },
  word: { fontFamily: font.displayBold, fontSize: 30, textAlign: 'center', marginBottom: 22 },
  summary: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 30, marginBottom: 14 },
  note: { height: undefined, minHeight: 120, paddingTop: 14, paddingBottom: 14 },
  next: { height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
});
