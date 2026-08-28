// app/(home)/pregnancy.tsx — pregnancy tracking.
//
// WOMEN ONLY. The backend rejects every query here with WOMEN_ONLY, so the hook
// skips them for other users and this screen shows a plain message instead of
// an error.
//
// TONE MATTERS MORE HERE THAN ANYWHERE ELSE IN THE APP.
//
// A pregnancy record can end for reasons nobody wants to be asked about by a
// form. So: ending is called "end tracking" rather than anything more specific,
// the outcome field is optional and free text rather than a list to pick from,
// there is no congratulation anywhere, and nothing is deleted automatically.
// A woman who has had a loss should be able to close the record in two taps
// without the app making her explain herself.
import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Redirect } from 'expo-router';

import { useTheme } from '@/constants/theme';
import usePullRefresh from '@/hooks/use-pull-refresh';
import { ScreenHeader } from '@/components/hero-backdrop';
import { useTabBarInset } from '@/components/glass-surface';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale, ProgressBar } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import usePregnancy from '@/hooks/use-pregnancy';
import { todayIso } from '@/lib/dates';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// a full term is 40 weeks from the last period
const TERM_WEEKS = 40;

export default function PregnancyScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const {
    isWoman, progress, current, past, start, end, saving, loading, refetch,
  } = usePregnancy();

  // the spinner shows for a pull, not for every background refetch
  const { refreshing, onRefresh } = usePullRefresh(refetch);

  const [lastPeriod, setLastPeriod] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onStart = async () => {
    if (!DATE_RE.test(lastPeriod.trim())) {
      setError(t.errLastPeriod);
      return;
    }

    setError(null);

    try {
      await start({ lastPeriodDate: lastPeriod.trim(), note: note.trim() || undefined });
      setLastPeriod('');
      setNote('');
      toast.success(t.pregnancyStarted);
    } catch (err) {
      setError(errorMessage(err, t.errGeneric));
    }
  };

  // Confirmed, but without asking why. The note is offered afterwards, not
  // demanded before.
  const onEnd = () => {
    if (!current) return;

    Alert.alert(t.endPregnancyTitle, t.endPregnancyBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.endPregnancy,
        style: 'destructive',
        onPress: async () => {
          try {
            await end(current.id, { endedAt: todayIso() });
            toast.success(t.pregnancyEnded);
          } catch (err) {
            toast.error(errorMessage(err, t.errGeneric));
          }
        },
      },
    ]);
  };

  const weeks = progress?.weeksPregnant ?? 0;
  const termProgress = Math.min(weeks / TERM_WEEKS, 1);

  // NOT SHOWN AT ALL for anyone who isn't a woman.
  //
  // The tab is already hidden, but hiding a tab does not remove a route — a
  // deep link, a saved link, or `router.push` from code still lands here, and
  // the screen used to answer that with a padlock, which is a page telling you
  // it is not for you. Sending them to the dashboard means the screen simply
  // does not exist for them.
  //
  // `loading` matters: `me` is null on the first render, so `isWoman` is false
  // before the answer arrives, and redirecting on that would bounce a woman off
  // her own screen every time she opened it.
  if (!isWoman && !loading) return <Redirect href="/(home)" />;

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <ScreenHeader back title={t.pregnancyTitle} subtitle={t.pregnancySub} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 + tabBarInset }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >
        <View style={styles.body}>
          {loading && !progress ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 32 }} />
          ) : progress?.active && current ? (
            <>
              {/* ------------------ in progress ------------------ */}
              <FadeIn index={0} style={[styles.bigCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.weeks, { color: c.text }]}>
                  {weeks}
                  <Text style={[styles.weeksUnit, { color: c.textMuted }]}> {t.weeksPregnant}</Text>
                </Text>

                {progress.daysIntoWeek != null && progress.daysIntoWeek > 0 && (
                  <Text style={[styles.daysInto, { color: c.textMuted }]}>
                    +{progress.daysIntoWeek} {t.dayShort}
                  </Text>
                )}

                <View style={{ width: '100%', marginTop: 16 }}>
                  <ProgressBar
                    progress={termProgress}
                    color={c.primary}
                    trackColor={c.fieldBg}
                    height={8}
                  />
                </View>

                <View style={styles.metaRow}>
                  {progress.trimester != null && (
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: c.textFaint }]}>{t.trimesterLabel}</Text>
                      <Text style={[styles.metaValue, { color: c.text }]}>{progress.trimester}</Text>
                    </View>
                  )}

                  {!!progress.dueDate && (
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: c.textFaint }]}>{t.dueDateLabel}</Text>
                      <Text style={[styles.metaValue, { color: c.text }]}>{progress.dueDate}</Text>
                    </View>
                  )}
                </View>

                {/* Past the due date is normal and extremely common, so this is
                    stated plainly rather than flagged as a problem. */}
                {progress.overdue ? (
                  <View style={[styles.notice, { backgroundColor: c.ring }]}>
                    <Ionicons name="information-circle-outline" size={15} color={c.primary} />
                    <Text style={[styles.noticeText, { color: c.primary }]}>{t.overdueLabel}</Text>
                  </View>
                ) : progress.daysUntilDue != null ? (
                  <Text style={[styles.countdown, { color: c.textMuted }]}>
                    {progress.daysUntilDue} {t.daysToGo}
                  </Text>
                ) : null}
              </FadeIn>

              {!!current.note && (
                <FadeIn index={1} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Text style={[styles.noteText, { color: c.textMuted }]}>{current.note}</Text>
                </FadeIn>
              )}

              <PressableScale
                onPress={onEnd}
                disabled={saving}
                style={[styles.ghost, { borderColor: c.border }]}
              >
                <Text style={[styles.ghostText, { color: c.textMuted }]}>{t.endPregnancy}</Text>
              </PressableScale>

              {/* the app is not a clinician, and this is the one screen where
                  that most needs saying */}
              <View style={[styles.disclaimer, { backgroundColor: c.ring }]}>
                <Ionicons name="medkit-outline" size={16} color={c.primary} />
                <Text style={[styles.disclaimerText, { color: c.primary }]}>{t.pregnancyDisclaimer}</Text>
              </View>
            </>
          ) : (
            <>
              {/* -------------------- not tracking -------------------- */}
              <FadeIn index={0} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.cardTitle, { color: c.text }]}>{t.noPregnancy}</Text>
                <Text style={[styles.cardBody, { color: c.textMuted }]}>{t.noPregnancySub}</Text>

                <Text style={[styles.label, { color: c.textMuted }]}>{t.lastPeriodLabel}</Text>
                <TextInput
                  value={lastPeriod}
                  onChangeText={(v) => { setLastPeriod(v); if (error) setError(null); }}
                  placeholder={t.datePh}
                  placeholderTextColor={c.textFaint}
                  keyboardType="numbers-and-punctuation"
                  style={[styles.input, { backgroundColor: c.fieldBg, borderColor: c.border, color: c.text }]}
                />

                <Text style={[styles.label, { color: c.textMuted }]}>{t.pregnancyNote}</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t.pregnancyNotePh}
                  placeholderTextColor={c.textFaint}
                  multiline
                  style={[styles.noteInput, { backgroundColor: c.fieldBg, borderColor: c.border, color: c.text }]}
                />

                {!!error && (
                  <View style={styles.errRow}>
                    <Ionicons name="alert-circle" size={14} color={c.danger} />
                    <Text style={[styles.errText, { color: c.danger }]}>{error}</Text>
                  </View>
                )}

                <PressableScale
                  onPress={onStart}
                  disabled={saving || !lastPeriod.trim()}
                  style={[
                    styles.primary,
                    { backgroundColor: c.primary, opacity: lastPeriod.trim() ? 1 : 0.5 },
                  ]}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryText}>{t.startPregnancy}</Text>}
                </PressableScale>
              </FadeIn>
            </>
          )}

          {/* -------------------- past records -------------------- */}
          {isWoman && !!past.length && (
            <>
              <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.pastPregnancies}</Text>

              <View style={{ gap: 10 }}>
                {past.map((item, i) => (
                  <FadeIn key={item.id} index={i + 2}>
                    <View style={[styles.pastRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                      <Ionicons name="time-outline" size={18} color={c.textFaint} />

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pastDate, { color: c.text }]}>
                          {item.lastPeriodDate} → {item.endedAt}
                        </Text>
                        {!!item.note && (
                          <Text style={[styles.pastNote, { color: c.textMuted }]} numberOfLines={2}>
                            {item.note}
                          </Text>
                        )}
                      </View>
                    </View>
                  </FadeIn>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({

  body: { paddingHorizontal: 22, paddingTop: 20, gap: 12 },

  bigCard: { borderWidth: 1, borderRadius: 22, padding: 22, alignItems: 'center' },
  weeks: { fontSize: 46, fontWeight: '800', letterSpacing: -1.5 },
  weeksUnit: { fontSize: 17, fontWeight: '700', letterSpacing: 0 },
  daysInto: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 28, marginTop: 18 },
  metaItem: { alignItems: 'center' },
  metaLabel: { fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 16, fontWeight: '800', marginTop: 3 },
  countdown: { fontSize: 13.5, fontWeight: '700', marginTop: 16 },
  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, marginTop: 16,
  },
  noticeText: { fontSize: 12.5, fontWeight: '700' },

  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
  cardTitle: { fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  cardBody: { fontSize: 13.5, fontWeight: '500', marginTop: 6, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15.5, fontWeight: '600', letterSpacing: 0.4,
  },
  noteInput: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14.5, fontWeight: '500', minHeight: 70, textAlignVertical: 'top',
  },
  noteText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  errText: { flex: 1, fontSize: 12.5, fontWeight: '600' },

  primary: {
    marginTop: 18, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { fontSize: 14.5, fontWeight: '700' },

  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 14, borderRadius: 16,
  },
  disclaimerText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },

  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: 20, marginBottom: 2,
  },
  pastRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderWidth: 1, borderRadius: 16,
  },
  pastDate: { fontSize: 14, fontWeight: '700' },
  pastNote: { fontSize: 12.5, fontWeight: '500', marginTop: 3 },

  empty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 34, borderWidth: 1, borderRadius: 20,
  },
  emptyText: { fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
});
