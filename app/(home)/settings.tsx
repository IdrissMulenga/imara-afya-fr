// app/(home)/settings.tsx — everything that configures the app rather than
// records anything about your health.
//
// Split out of More, which had drifted into being both a feature launcher and a
// settings page. Those are different jobs: More is "what can this app do", this
// is "how should it behave". Mixing them meant the language picker sat directly
// under Health records, which reads as another feature.
//
// Grouped as ACCOUNT (things tied to who you are) and APP (things tied to this
// phone), because that split is also where the data lives — the password is on
// the server, the theme is not.
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { ScreenHeader } from '@/components/hero-backdrop';
import { useTabBarInset } from '@/components/glass-surface';
import { useStrings } from '@/constants/strings';
import { FadeIn, PressableScale } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';
import LanguagePicker from '@/components/language-picker';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import useReminders from '@/hooks/use-reminders';
import useMedReminders from '@/hooks/use-med-reminders';
import usePreferences from '@/hooks/use-preferences';
import useMe from '@/hooks/use-me';

/** A settings row that opens another screen. */
function LinkRow({
  icon,
  tint,
  title,
  subtitle,
  onPress,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  index: number;
}) {
  const { c } = useTheme();

  return (
    <FadeIn index={index}>
      <PressableScale
        onPress={onPress}
        style={[styles.card, styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
      >
        <View style={[styles.icon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={19} color="#0F7A54" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={2}>{subtitle}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
      </PressableScale>
    </FadeIn>
  );
}

/** A settings row that toggles something in place. */
function SwitchRow({
  icon,
  tint,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  index: number;
}) {
  const { c } = useTheme();

  return (
    <FadeIn index={index}>
      <View style={[styles.card, styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.icon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={19} color="#0F7A54" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={2}>{subtitle}</Text>
        </View>

        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ true: c.primary, false: c.borderStrong }}
          thumbColor="#fff"
        />
      </View>
    </FadeIn>
  );
}

export default function SettingsScreen() {
  const { c, dark, setDark } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const toast = useToast();

  const { me } = useMe();

  // WHETHER THIS SCREEN HAS A BACK ARROW depends on how it was reached.
  //
  // Settings takes the fourth tab slot for anyone who isn't a woman — cycle
  // takes it for women, who therefore arrive here by pushing from the profile
  // hub. An arrow on a tab points nowhere; its absence on a pushed screen
  // strands you. `canGoBack()` can't answer this, because it is read during
  // render and tab screens stay mounted with a stale answer.
  const isTab = me?.gender !== 'Woman';
  const reminders = useReminders();
  const medReminders = useMedReminders();
  const { unitSystem, setUnits } = usePreferences();

  const onToggleReminders = (next: boolean) => {
    reminders.toggle(next).then((done) => {
      if (next && done) toast.success(t.notifOn);
      else if (!next) toast.success(t.notifOff);
      // asked and refused, or the runtime can't schedule — say which
      else toast.error(t.notifDenied);
    });
  };

  const onToggleMedReminders = (next: boolean) => {
    medReminders.toggle(next).then((done) => {
      if (next && done) toast.success(t.medRemindersOn);
      else if (!next) toast.success(t.medRemindersOff);
      else toast.error(t.notifDenied);
    });
  };

  const onPickUnits = async (next: 'metric' | 'imperial') => {
    if (next === unitSystem) return;

    try {
      await setUnits(next);
      toast.success(t.unitsChanged);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style="light" />

      <ScreenHeader back={!isTab} title={t.settingsTitle} subtitle={t.settingsSub} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 + tabBarInset }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          {/* ------------------------- account ------------------------- */}
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.accountSection}</Text>

          <LinkRow
            icon="person-outline"
            tint="#F3E8FF"
            title={t.myProfile}
            subtitle={me?.email ?? (me?.plan === 'premium' ? t.planPremium : t.planFree)}
            onPress={() => router.push('/(home)/profile')}
            index={0}
          />

          <LinkRow
            icon="lock-closed-outline"
            tint="#FEE2E2"
            title={t.changePasswordTitle}
            subtitle={t.changePasswordSub}
            onPress={() => router.push('/(home)/password')}
            index={1}
          />

          {/* --------------------------- app --------------------------- */}
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.appSection}</Text>

          <SwitchRow
            icon="medkit-outline"
            tint="#DCFCE7"
            title={t.medRemindersTitle}
            // three different states, three different explanations: blocked by
            // the OS, nothing to remind about, or how many will actually fire
            subtitle={
              medReminders.blocked
                ? t.notifDenied
                : medReminders.reminderCount === 0
                  ? t.medRemindersNone
                  : `${medReminders.reminderCount} ${t.remindersScheduled}`
            }
            value={medReminders.enabled}
            onValueChange={onToggleMedReminders}
            disabled={medReminders.busy || !medReminders.ready || medReminders.blocked}
            index={2}
          />

          <SwitchRow
            icon="notifications-outline"
            tint="#DBEAFE"
            title={t.notifTitle}
            // say WHY it can't be turned on rather than just refusing to move
            subtitle={reminders.blocked ? t.notifDenied : t.notifSub}
            value={reminders.enabled}
            onValueChange={onToggleReminders}
            disabled={reminders.busy || !reminders.ready || reminders.blocked}
            index={2}
          />

          <SwitchRow
            icon="moon-outline"
            tint="#EDE9FE"
            title={t.darkMode}
            subtitle={t.appearanceSub}
            value={dark}
            onValueChange={setDark}
            index={3}
          />

          {/* ------------------------- units --------------------------- */}
          <FadeIn index={4} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.cardHead}>
              <View style={[styles.icon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="scale-outline" size={19} color="#0F7A54" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: c.text }]}>{t.unitsTitle}</Text>
                <Text style={[styles.subtitle, { color: c.textMuted }]}>{t.unitsSub}</Text>
              </View>
            </View>

            {/* Only the DISPLAY changes — everything is stored in metric, so
                switching back and forth never alters recorded history. */}
            <View style={styles.segment}>
              {(['metric', 'imperial'] as const).map((option) => {
                const active = unitSystem === option;

                return (
                  <PressableScale
                    key={option}
                    onPress={() => onPickUnits(option)}
                    style={[
                      styles.segmentItem,
                      {
                        backgroundColor: active ? c.primary : c.fieldBg,
                        borderColor: active ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? '#fff' : c.textMuted },
                      ]}
                    >
                      {option === 'metric' ? t.unitsMetric : t.unitsImperial}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </FadeIn>

          {/* ------------------------ language ------------------------- */}
          <FadeIn index={5} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.cardHead}>
              <View style={[styles.icon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="language-outline" size={19} color="#0F7A54" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: c.text }]}>{t.languageTitle}</Text>
                <Text style={[styles.subtitle, { color: c.textMuted }]}>{t.languageSub}</Text>
              </View>
            </View>

            <View style={{ height: 14 }} />

            {/* switching re-renders the app straight away and is remembered
                on this device, so it survives a restart */}
            <LanguagePicker onChange={() => toast.success(t.languageChanged)} />
          </FadeIn>
        </View>
      </ScrollView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({

  body: { paddingHorizontal: 22, paddingTop: 8, gap: 10 },

  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: 16, marginBottom: 2,
  },

  card: { borderWidth: 1, borderRadius: 18, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },

  segment: { flexDirection: 'row', gap: 10, marginTop: 14 },
  segmentItem: {
    flex: 1, borderWidth: 1, borderRadius: 13,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '700' },
});
