// app/(home)/habits.tsx — daily habits: water, sleep, weight.
// Backed by habitSummary / logHabit / setWaterGoal.
import { useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Keyboard,
  ActivityIndicator, RefreshControl,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale, ProgressBar } from '@/components/motion';
import WaterDot from '@/components/habits/water-dot';
import useHabits from '@/hooks/use-habits';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';

export default function HabitsScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  // this screen sits inside the tab navigator, so the tab bar already covers
  // the bottom inset — measuring it is what keeps the keyboard maths honest
  const tabBarHeight = useBottomTabBarHeight();

  const { summary, addWater, logSleep, logWeight, logging, loading, refetch } = useHabits();

  const [sleep, setSleep] = useState('');
  const [weight, setWeight] = useState('');

  // The sleep and weight fields sit near the bottom, so the keyboard covers
  // them on open. Both platforms already shrink the scroll area on their own
  // (automaticallyAdjustKeyboardInsets on iOS, softwareKeyboardLayoutMode
  // "resize" on Android) — all we add is scrolling the focused card into it.
  const scrollRef = useRef<ScrollView>(null);
  const bodyY = useRef(0);
  const cardY = useRef<Record<string, number>>({});

  const measureCard = (key: string) => (e: LayoutChangeEvent) => {
    cardY.current[key] = e.nativeEvent.layout.y;
  };

  const onFieldFocus = (key: string) => {
    // wait a beat for the keyboard animation to finish, otherwise we scroll to
    // a position that stops existing the moment the viewport resizes
    setTimeout(() => {
      const y = cardY.current[key];
      if (y == null) return;
      // RN clamps this to the real content height, so an over-scroll just puts
      // the card as high as it can go — never leaves a gap below
      scrollRef.current?.scrollTo({ y: Math.max(bodyY.current + y - 16, 0), animated: true });
    }, 180);
  };

  const goal = summary?.waterGoal ?? 8;
  const today = summary?.waterToday ?? 0;
  // clamp so over-drinking doesn't overflow the row of dots
  const filled = Math.min(today, goal);

  const bmiLabel = (key?: string | null) => {
    if (key === 'underweight') return t.bmiUnderweight;
    if (key === 'normal') return t.bmiNormal;
    if (key === 'overweight') return t.bmiOverweight;
    if (key === 'obese') return t.bmiObese;
    return null;
  };

  const onAddWater = async () => {
    try {
      await addWater();
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  // both sleep and weight take a plain number, so share one submit path
  const submitNumber = async (raw: string, run: (n: number) => Promise<unknown>, clear: () => void) => {
    const value = Number(raw.replace(',', '.'));

    if (!raw.trim() || !Number.isFinite(value) || value <= 0) {
      toast.error(t.errNumber);
      return;
    }

    try {
      await run(value);
      clear();
      Keyboard.dismiss();
      toast.success(t.habitLogged);
    } catch (err) {
      // the backend rejects sleep > 24h and weight outside 2–500kg
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />

      {/* fixed header — stays put while the body scrolls */}
      <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroTitle}>{t.habitsTitle}</Text>
        <Text style={styles.heroSub}>{t.habitsSub}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        // just enough to clear the tab bar — insets.bottom is already inside it
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // iOS insets the scroll area by exactly the keyboard height on its own —
        // no KeyboardAvoidingView, no padding maths, so nothing to double-count.
        // Android does the same via softwareKeyboardLayoutMode "resize".
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={c.primary} />
        }
      >

        {loading && !summary ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
        ) : (
          <View
            style={styles.body}
            onLayout={(e) => {
              bodyY.current = e.nativeEvent.layout.y;
            }}
          >
            {/* ---------------- water ---------------- */}
            <FadeIn index={0} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.cardHead}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="water" size={19} color="#2563EB" />
                  <Text style={[styles.cardTitle, { color: c.text }]}>{t.waterTitle}</Text>
                </View>
                {!!summary?.waterStreak && (
                  <View style={[styles.streak, { backgroundColor: c.ring }]}>
                    <Ionicons name="flame" size={13} color={c.primary} />
                    <Text style={[styles.streakText, { color: c.primary }]}>
                      {summary.waterStreak} {t.streakLabel}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.bigValue, { color: c.text }]}>
                {today}
                <Text style={[styles.bigUnit, { color: c.textMuted }]}>
                  {' '}/ {goal} {t.glasses}
                </Text>
              </Text>

              {/* one dot per glass — reads faster than a progress bar */}
              <View style={styles.dots}>
                {Array.from({ length: Math.round(goal) }).map((_, i) => (
                  <WaterDot
                    key={i}
                    index={i}
                    filled={i < filled}
                    fillColor="#2563EB"
                    emptyColor={c.fieldBg}
                  />
                ))}
              </View>

              <View style={{ height: 12 }} />
              <ProgressBar progress={today / goal} color="#2563EB" trackColor={c.fieldBg} />

              {summary?.waterGoalMet && (
                <Text style={[styles.goalMet, { color: c.primary }]}>{t.goalMet}</Text>
              )}

              <PressableScale
                onPress={onAddWater}
                disabled={logging}
                style={[styles.action, { backgroundColor: c.primary }]}
              >
                <Ionicons name="add" size={19} color="#fff" />
                <Text style={styles.actionText}>{t.addGlass}</Text>
              </PressableScale>
            </FadeIn>

            {/* ---------------- sleep ---------------- */}
            <FadeIn
              index={1}
              onLayout={measureCard('sleep')}
              style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <View style={styles.cardTitleRow}>
                <Ionicons name="moon" size={18} color="#7C3AED" />
                <Text style={[styles.cardTitle, { color: c.text }]}>{t.sleepTitle}</Text>
              </View>

              <Text style={[styles.bigValue, { color: c.text }]}>
                {summary?.sleepLastNight ?? '—'}
                <Text style={[styles.bigUnit, { color: c.textMuted }]}>
                  {summary?.sleepLastNight != null ? ` ${t.hoursShort}` : ''}
                </Text>
              </Text>
              <Text style={[styles.caption, { color: c.textMuted }]}>{t.sleepLast}</Text>

              <View style={styles.inputRow}>
                <TextInput
                  value={sleep}
                  onChangeText={setSleep}
                  onFocus={() => onFieldFocus('sleep')}
                  placeholder={t.sleepPh}
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => submitNumber(sleep, logSleep, () => setSleep(''))}
                  style={[styles.input, { backgroundColor: c.fieldBg, borderColor: c.border, color: c.text }]}
                />
                <PressableScale
                  onPress={() => submitNumber(sleep, logSleep, () => setSleep(''))}
                  disabled={logging}
                  style={[styles.inlineBtn, { backgroundColor: c.primary }]}
                >
                  <Text style={styles.inlineBtnText}>{t.logSleep}</Text>
                </PressableScale>
              </View>
            </FadeIn>

            {/* ---------------- weight / BMI ---------------- */}
            <FadeIn
              index={2}
              onLayout={measureCard('weight')}
              style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <View style={styles.cardTitleRow}>
                <Ionicons name="fitness" size={18} color="#0F7A54" />
                <Text style={[styles.cardTitle, { color: c.text }]}>{t.weightTitle}</Text>
              </View>

              <Text style={[styles.bigValue, { color: c.text }]}>
                {summary?.latestWeight ?? '—'}
                <Text style={[styles.bigUnit, { color: c.textMuted }]}>
                  {summary?.latestWeight != null ? ` ${t.kgShort}` : ''}
                </Text>
              </Text>

              {summary?.bmi != null ? (
                <Text style={[styles.caption, { color: c.textMuted }]}>
                  {t.bmiLabel} {summary.bmi} · {bmiLabel(summary.bmiCategory)}
                </Text>
              ) : (
                // BMI needs height, which lives on the profile
                <Text style={[styles.caption, { color: c.textFaint }]}>{t.bmiNeedsProfile}</Text>
              )}

              <View style={styles.inputRow}>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  onFocus={() => onFieldFocus('weight')}
                  placeholder={t.weightPh}
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => submitNumber(weight, logWeight, () => setWeight(''))}
                  style={[styles.input, { backgroundColor: c.fieldBg, borderColor: c.border, color: c.text }]}
                />
                <PressableScale
                  onPress={() => submitNumber(weight, logWeight, () => setWeight(''))}
                  disabled={logging}
                  style={[styles.inlineBtn, { backgroundColor: c.primary }]}
                >
                  <Text style={styles.inlineBtnText}>{t.logWeight}</Text>
                </PressableScale>
              </View>
            </FadeIn>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22, paddingBottom: 26,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 6 },

  body: { paddingHorizontal: 22, paddingTop: 22, gap: 14 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },

  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  streakText: { fontSize: 11.5, fontWeight: '800' },

  bigValue: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 12 },
  bigUnit: { fontSize: 15, fontWeight: '600', letterSpacing: 0 },
  caption: { fontSize: 13, fontWeight: '500', marginTop: 4 },

  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  goalMet: { fontSize: 13, fontWeight: '700', marginTop: 12 },

  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 14, paddingVertical: 14, marginTop: 16,
  },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  inputRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600',
  },
  inlineBtn: { borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  inlineBtnText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
});
